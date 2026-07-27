# Plan-Only Commands

Do not run `az deployment sub create` in Phase 2B-3C-1.

```bash
az account show
az account set --subscription 701a8554-a166-46e9-bf13-743bc50e3b20
az bicep build --file clients/hc-demo-new/18-phase2b3c-azure-lab-implementation/01-infrastructure-as-code/main.bicep
POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD='<secure operator supplied value>' \
az deployment sub what-if \
  --location eastus \
  --name hcdn-phase2b3c1-plan \
  --template-file clients/hc-demo-new/18-phase2b3c-azure-lab-implementation/01-infrastructure-as-code/main.bicep \
  --parameters clients/hc-demo-new/18-phase2b3c-azure-lab-implementation/01-infrastructure-as-code/hcdn.lab.bicepparam
```

Apply remains blocked until this what-if is independently reviewed.
