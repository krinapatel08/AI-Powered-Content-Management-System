import os
import ssl
import certifi
from dotenv import load_dotenv
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.views import APIView
from openai import OpenAI
from .models import Article, AIUsage, User
from .serializers import ArticleSerializer, AIUsageSerializer, UserRegisterSerializer
from .permissions import IsAuthorOrReadOnly

ssl_context = ssl.create_default_context(cafile=certifi.where())
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TOKEN_PRICE = 0.02


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate(self, request):
        topic = request.data.get('topic')
        if not topic:
            return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not client.api_key:
            return Response({"error": "OpenAI API key not set"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": f"Write a detailed blog article about: {topic}"}
                ],
                max_tokens=500,
                temperature=0.7
            )

            generated_text = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens
            estimated_cost = round(tokens / 1000 * TOKEN_PRICE, 4)

            AIUsage.objects.create(
                user=request.user,
                feature='generate',
                tokens_used=tokens,
                estimated_cost=estimated_cost
            )

            return Response({
                "topic": topic,
                "content": generated_text,
                "tokens_used": tokens,
                "estimated_cost": estimated_cost
            })

        except Exception as e:
            import traceback
            print("❌ ERROR:", e)
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _run_openai_action(self, article, prompt, feature, max_tokens=150, temperature=0.5):
        if not article.content:
            return {"error": "Article content is empty"}, None, None
        if not client.api_key:
            return {"error": "OpenAI API key not set"}, None, None

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )

            result_text = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens
            estimated_cost = round(tokens / 1000 * TOKEN_PRICE, 4)

            AIUsage.objects.create(
                user=self.request.user,
                article=article,
                feature=feature,
                tokens_used=tokens,
                estimated_cost=estimated_cost
            )

            return result_text, tokens, estimated_cost

        except Exception as e:
            return {"error": str(e)}, None, None

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def summarize(self, request, pk=None):
        article = self.get_object()
        result, tokens, estimated_cost = self._run_openai_action(
            article,
            f"Summarize this article in 3-5 sentences:\n\n{article.content}",
            "summarize", 150, 0.5
        )
        if isinstance(result, dict):
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        article.summary = result
        article.save()
        return Response({"summary": result, "tokens_used": tokens, "estimated_cost": estimated_cost})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def seo(self, request, pk=None):
        article = self.get_object()
        result, tokens, estimated_cost = self._run_openai_action(
            article,
            f"Suggest meta title, description, and keywords for SEO for this article:\n\n{article.content}",
            "seo", 100, 0.5
        )
        if isinstance(result, dict):
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"seo_suggestions": result, "tokens_used": tokens, "estimated_cost": estimated_cost})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def tags(self, request, pk=None):
        article = self.get_object()
        result, tokens, estimated_cost = self._run_openai_action(
            article,
            f"Generate 5-10 relevant tags for this article:\n\n{article.content}",
            "tags", 50, 0.5
        )
        if isinstance(result, dict):
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        tags_list = [t.strip() for t in result.split(",") if t.strip()]
        return Response({"tags": tags_list, "tokens_used": tokens, "estimated_cost": estimated_cost})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def sentiment(self, request, pk=None):
        article = self.get_object()
        result, tokens, estimated_cost = self._run_openai_action(
            article,
            f"Analyze the sentiment of this article as Positive, Neutral, or Negative:\n\n{article.content}",
            "sentiment", 10, 0
        )
        if isinstance(result, dict):
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"sentiment": result, "tokens_used": tokens, "estimated_cost": estimated_cost})


class AIUsageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIUsageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIUsage.objects.filter(user=self.request.user).order_by('-created_at')


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email
        })
