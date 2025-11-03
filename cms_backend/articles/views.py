# articles/views.py
import os
import traceback
from dotenv import load_dotenv
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.views import APIView
from google import genai
from google.genai import types
from .models import Article, AIUsage, User
from .serializers import ArticleSerializer, AIUsageSerializer, UserRegisterSerializer
from .permissions import IsAuthorOrReadOnly

# Load env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Init Gemini client (safe)
try:
    client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception as e:
    print("⚠️ Gemini init error:", e)
    client = None

# Token pricing example: $0.02 per 1k tokens -> 0.00002 per token
TOKEN_PRICE = 0.00002


def extract_gemini_text(resp):
    """
    Robust extractor for Gemini generate_content responses.
    Returns the best available text or empty string.
    """
    if not resp:
        return ""

    # common attribute
    try:
        if hasattr(resp, "text") and resp.text:
            return resp.text.strip()
    except Exception:
        pass

    # other possible attributes
    try:
        if hasattr(resp, "output_text") and resp.output_text:
            return resp.output_text.strip()
    except Exception:
        pass

    # candidates -> candidate.content.parts[*].text
    try:
        if hasattr(resp, "candidates") and resp.candidates:
            cand = resp.candidates[0]
            content = getattr(cand, "content", None)
            parts = getattr(content, "parts", None)
            if parts:
                texts = []
                for p in parts:
                    # p may be dict-like or object-like
                    text = getattr(p, "text", None) if hasattr(p, "text") else (p.get("text") if isinstance(p, dict) else None)
                    if text:
                        texts.append(text)
                if texts:
                    return " ".join(texts).strip()
    except Exception:
        pass

    # parsed (if present)
    try:
        if hasattr(resp, "parsed") and resp.parsed:
            return str(resp.parsed).strip()
    except Exception:
        pass

    return ""


# ----------------- USER REGISTRATION -----------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer


# ----------------- ARTICLE MANAGEMENT -----------------
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by("-created_at")
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    # ---------------- Generate (returns content+tags; DOES NOT auto-save article) ----------------
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def generate(self, request):
        """
        Generate blog content + tags and return them.
        Important: This endpoint no longer auto-saves the Article.
        Frontend should call POST /articles/ to save when user publishes.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Please login first."}, status=status.HTTP_401_UNAUTHORIZED)

        topic = request.data.get("topic", "").strip()
        if not topic:
            return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not client:
            return Response({"error": "Gemini client not initialized"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            prompt = (
                f"You are a professional blog writer. Write a polished, SEO-friendly blog post about '{topic}'.\n\n"
                "Requirements:\n"
                " - Use a catchy title (with one emoji).\n"
                " - Add an engaging intro paragraph.\n"
                " - Use markdown headings (##, ###), short paragraphs, spacing, and occasional emojis.\n"
                " - Highlight key ideas using bold or italic where helpful.\n"
                " - End with an inspiring conclusion.\n"
                " - Then include a section titled '### 🏷️ Related Tags' and list 6 short tags separated by commas.\n\n"
                "Return ONLY the final markdown blog post (no extra commentary)."
            )

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Part(text=prompt)],
                config=types.GenerateContentConfig(temperature=0.9, max_output_tokens=3500),
            )

            text = extract_gemini_text(resp)
            if not text:
                return Response({"error": "Empty AI response"}, status=status.HTTP_400_BAD_REQUEST)

            # Extract tag list from bottom 'Related Tags' section if present
            tags_list = []
            if "Related Tags" in text:
                try:
                    section = text.split("Related Tags", 1)[-1]
                    section = section.replace("🏷️", "").replace("#", "")
                    tags_list = [t.strip() for t in section.split(",") if t.strip()]
                    # trim to 6 tags max
                    tags_list = tags_list[:6]
                except Exception:
                    tags_list = []
            if not tags_list:
                tags_list = ["AI", "Blogging", "Innovation", "Technology", "Learning", "Creativity"]

            # Estimate tokens / cost
            tokens = max((len(topic) + len(text)) // 4, 1)
            estimated_cost = round(tokens * TOKEN_PRICE, 6)

            # Record AI usage (article not yet created) — link article=None
            AIUsage.objects.create(
                user=request.user,
                article=None,
                feature="generate",
                tokens_used=tokens,
                estimated_cost=estimated_cost,
            )

            return Response({
                "topic": topic,
                "content": text,
                "tags": tags_list,
                "tokens_used": tokens,
                "estimated_cost": estimated_cost
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ AI Error (generate):", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ---------------- Summarize (returns summary; DOES NOT save to Article) ----------------
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def summarize(self, request, pk=None):
        """
        Generate and return a summary for the article.
        Does NOT save the summary to the Article model to avoid showing it on home page automatically.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Please login first."}, status=status.HTTP_401_UNAUTHORIZED)

        article = self.get_object()
        content = (article.content or "").strip()
        if not content:
            return Response({"error": "Article content is empty"}, status=status.HTTP_400_BAD_REQUEST)
        if not client:
            return Response({"error": "Gemini client not initialized"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # trim to reasonable length for model
        content_short = content[:3000]

        try:
            prompt = (
                "Summarize the following blog post in 4-6 clear, professional sentences. "
                "Avoid bullet points. Include emojis only when relevant.\n\n"
                f"{content_short}"
            )

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Part(text=prompt)],
                config=types.GenerateContentConfig(temperature=0.6, max_output_tokens=600),
            )

            summary = extract_gemini_text(resp)

            # fallback retry with simpler prompt if empty
            if not summary:
                fallback_prompt = f"Briefly summarize this text in 2-3 sentences:\n\n{content_short[:1200]}"
                resp2 = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[types.Part(text=fallback_prompt)],
                    config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=300),
                )
                summary = extract_gemini_text(resp2)

            if not summary:
                return Response({"error": "AI returned an empty summary. Try again."}, status=status.HTTP_400_BAD_REQUEST)

            # Log usage (we keep article reference but do NOT write summary into the model)
            tokens = max((len(content) + len(summary)) // 4, 1)
            estimated_cost = round(tokens * TOKEN_PRICE, 6)
            AIUsage.objects.create(
                user=request.user,
                article=article,
                feature="summarize",
                tokens_used=tokens,
                estimated_cost=estimated_cost,
            )

            return Response({"summary": summary, "estimated_cost": estimated_cost}, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ Summarization Error:", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ---------------- Sentiment Analysis ----------------
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def sentiment(self, request, pk=None):
        """
        Return sentiment classification for the article content.
        """
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Please login first."}, status=status.HTTP_401_UNAUTHORIZED)

        article = self.get_object()
        content = (article.content or "").strip()
        if not content:
            return Response({"error": "Article content is empty"}, status=status.HTTP_400_BAD_REQUEST)
        if not client:
            return Response({"error": "Gemini client not initialized"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        content_short = content[:3000]

        try:
            prompt = (
                "Read the article below and classify its overall sentiment as either: "
                "'Positive', 'Negative', or 'Neutral/Mixed'. Return the classification followed by one short sentence justification.\n\n"
                f"{content_short}"
            )

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Part(text=prompt)],
                config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=300),
            )

            sentiment_text = extract_gemini_text(resp)
            if not sentiment_text:
                return Response({"error": "Sentiment analysis failed. Empty AI response."}, status=status.HTTP_400_BAD_REQUEST)

            # Log usage
            tokens = max((len(content) + len(sentiment_text)) // 4, 1)
            estimated_cost = round(tokens * TOKEN_PRICE, 6)
            AIUsage.objects.create(
                user=request.user,
                article=article,
                feature="sentiment",
                tokens_used=tokens,
                estimated_cost=estimated_cost,
            )

            return Response({"sentiment": sentiment_text, "estimated_cost": estimated_cost}, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ Sentiment Error:", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------- AI USAGE LOG -----------------
class AIUsageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIUsage.objects.filter(user=self.request.user).select_related("article").order_by("-created_at")


# ----------------- CURRENT USER -----------------
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        })
