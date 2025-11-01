from django.contrib import admin

from .models import Complaint,ComplaintImage, Upvote

admin.site.register(Complaint)
admin.site.register(ComplaintImage) 
admin.site.register(Upvote)
