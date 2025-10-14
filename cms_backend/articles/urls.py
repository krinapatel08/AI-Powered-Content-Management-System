from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ArticleViewSet,AIUsageViewSet
from .views import CurrentUserView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='articles')
router.register(r'usage', AIUsageViewSet, basename='aiusage')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    
]
