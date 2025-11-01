from django.contrib import admin

from .models import Citizen, Government_Authority, Field_Worker, Department,ParentUser

admin.site.register(ParentUser)
admin.site.register(Citizen)
admin.site.register(Government_Authority)
admin.site.register(Field_Worker)
admin.site.register(Department)



