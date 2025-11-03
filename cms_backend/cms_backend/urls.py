"""
URL configuration for cms_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# 1. Import the default view for the API root (optional, but clean)
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
# Optionally, register your views with the router here

urlpatterns = [
    # 2. ADD THIS LINE to handle the root URL (/) and redirect to /api/
    path('', include('articles.urls')), # Assuming articles.urls is where your API root is defined
    
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),   
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('api/', include('articles.urls')),   
]
