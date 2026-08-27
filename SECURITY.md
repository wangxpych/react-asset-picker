# Security policy

Do not include storage credentials or privileged upload logic in picker props or
client bundles. Prefer short-lived presigned URLs or an authenticated application
API, validate files again on the server, and serve uploads with safe content
headers.

Once the public repository exists, report suspected vulnerabilities through a
private GitHub security advisory instead of a public issue. A dedicated security
contact may be added before the first stable release.
