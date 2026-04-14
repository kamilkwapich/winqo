from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TENANT_OWNER = "TENANT_OWNER"
    TENANT_USER = "TENANT_USER"
