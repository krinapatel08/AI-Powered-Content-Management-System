import os
import traceback
from dotenv import load_dotenv
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.views import APIView
import google.generativeai as genai
from google.generativeai import types

from .models import Article, AIUsage, User
from .serializers import ArticleSerializer, AIUsageSerializer, UserRegisterSerializer
from .permissions import IsAuthorOrReadOnly



load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("⚠️ GEMINI_API_KEY not found!")

TOKEN_PRICE = 0.00002



def extract_gemini_text(resp):
    """Safely extract text from Gemini API response."""
    if not resp:
        return ""

    for attr in ("text", "output_text"):
        text = getattr(resp, attr, None)
        if text:
            return text.strip()

    
    try:
        cand = getattr(resp, "candidates", [None])[0]
        parts = getattr(getattr(cand, "content", None), "parts", None)
        if parts:
            texts = [getattr(p, "text", None) or p.get("text") for p in parts if p]
            return " ".join(filter(None, texts)).strip()
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
        # Save the article
        article = serializer.save(author=self.request.user)

        # ✅ Link the last AIUsage (generate) record to this article
        last_usage = AIUsage.objects.filter(
            user=self.request.user,
            article__isnull=True,
            feature="generate"
        ).order_by("-created_at").first()

        if last_usage:
            last_usage.article = article
            last_usage.save()

   
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def generate(self, request):
        """Generate blog content and tags using Gemini API (no auto-save)."""
        topic = request.data.get("topic", "").strip()
        if not topic:
            return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
         
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = (
                f"You are a professional blog writer. Write a polished, SEO-friendly blog post about '{topic}'.\n\n"
                "Use a catchy title (with one emoji), markdown headings, short paragraphs, and end with '### 🏷️ Related Tags'."
            )

          
            resp = model.generate_content(
                prompt,
                generation_config=types.GenerationConfig(
                    temperature=0.9,
                    max_output_tokens=3500
                ),
            )
            text = extract_gemini_text(resp)
            if not text:
                return Response({"error": "Empty AI response"}, status=400)

         
            tags = []
            if "Related Tags" in text:
                section = text.split("Related Tags", 1)[-1]
                section = section.replace("🏷️", "").replace("#", "")
                tags = [t.strip() for t in section.split(",") if t.strip()][:6]
            if not tags:
                tags = ["AI", "Blogging", "Innovation", "Technology", "Learning", "Creativity"]

            tokens = max((len(topic) + len(text)) // 4, 1)
            cost = round(tokens * TOKEN_PRICE, 6)

            AIUsage.objects.create(
                user=request.user,
                article=None,
                feature="generate",
                tokens_used=tokens,
                estimated_cost=cost,
            )

           
            return Response({
                "message": "✅ Blog generated successfully! (Not saved yet)",
                "topic": topic,
                "content": text,
                "tags": tags,
                "tokens_used": tokens,
                "estimated_cost": cost,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ AI Error (generate):", e)
            print(traceback.format_exc())
            return Response({"error": "AI generation failed", "details": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

   
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def summarize(self, request, pk=None):
        article = self.get_object()
        content = (article.content or "").strip()
        if not content:
            return Response({"error": "Article content is empty"}, status=400)

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = f"Summarize this blog post in 4–6 professional sentences:\n\n{content[:3000]}"
            resp = model.generate_content(prompt, generation_config=types.GenerationConfig(
                temperature=0.6, max_output_tokens=600))
            summary = extract_gemini_text(resp)

            if not summary:
                return Response({"error": "Empty summary response"}, status=400)

            tokens = max((len(content) + len(summary)) // 4, 1)
            cost = round(tokens * TOKEN_PRICE, 6)
            AIUsage.objects.create(user=request.user, article=article,
                                   feature="summarize", tokens_used=tokens, estimated_cost=cost)
            return Response({"summary": summary, "estimated_cost": cost})
        except Exception as e:
            print("❌ Summarization Error:", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)

    # --------- SENTIMENT ANALYSIS ---------
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def sentiment(self, request, pk=None):
        article = self.get_object()
        content = (article.content or "").strip()
        if not content:
            return Response({"error": "Article content is empty"}, status=400)

        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = (
                "Classify the overall sentiment of the following article as 'Positive', 'Negative', or 'Neutral'. "
                "Add one sentence justification.\n\n"
                f"{content[:3000]}"
            )
            resp = model.generate_content(prompt, generation_config=types.GenerationConfig(
                temperature=0.3, max_output_tokens=300))
            sentiment_text = extract_gemini_text(resp)
            if not sentiment_text:
                return Response({"error": "Empty AI response"}, status=400)

            tokens = max((len(content) + len(sentiment_text)) // 4, 1)
            cost = round(tokens * TOKEN_PRICE, 6)
            AIUsage.objects.create(user=request.user, article=article,
                                   feature="sentiment", tokens_used=tokens, estimated_cost=cost)
            return Response({"sentiment": sentiment_text, "estimated_cost": cost})
        except Exception as e:
            print("❌ Sentiment Error:", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)


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
