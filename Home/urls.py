from django.urls import path

from .views import homeView

urlpatterns = [
    #path('endereço/', minhaView.as_view(), name='nome'),
    path('', homeView.as_view(), name='inicio'),
]
