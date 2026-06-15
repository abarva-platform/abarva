# Product Dev Management Group Blocker

Status date: 2026-06-15 CDT

Product Dev subscription `58eef48c-3ed6-48e6-9af4-de1848ad3401` is not yet
placed under the intended management group because the current Azure principal
does not have usable management-group read/placement access for
`abarva-product`.

This was intentionally left blocked rather than worked around with broad
Owner/User Access Administrator grants.

Next safe options:

1. Have an Azure tenant administrator place the Product Dev subscription under
   the intended management group.
2. Grant the current operator the narrow management-group permissions needed to
   read and place this subscription.
3. Approve a narrower subscription-level policy assignment packet for Product
   Dev while management-group ownership is being resolved.

Do not use this Product Dev approval file to create Product Preview, Product
Prod, Client Preprod, or Client Prod resources.
