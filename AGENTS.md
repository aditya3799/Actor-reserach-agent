# AGENTS.md — RivetKit Reference & Guidelines

## RivetKit Documentation Reference
For all RivetKit actor, state, event, action, connection, and client implementation details, refer to the official documentation:
- **RivetKit LLM Reference**: [https://rivet.dev/llms.txt](https://rivet.dev/llms.txt)
- **Actors Documentation**: [https://rivet.dev/docs/actors](https://rivet.dev/docs/actors)
- **Deploy Guide**: [https://rivet.dev/docs/deploy/vm-and-bare-metal](https://rivet.dev/docs/deploy/vm-and-bare-metal)
- **Client Docs**: [https://rivet.dev/docs/clients](https://rivet.dev/docs/clients)
- **Troubleshooting**: [https://rivet.dev/docs/actors/troubleshooting](https://rivet.dev/docs/actors/troubleshooting)

## Namespace Control
> **CRITICAL**: Always connect using the `--namespace rivet-5apq-rivet-5apq-rivet-1m8x` flag or environment variable. Never modify or deploy to the default `production` namespace.

## Worker / Self-Host Connection Credentials (current)
- **Namespace**: `rivet-5apq-rivet-5apq-rivet-1m8x`
- **Control Plane Endpoint**: `https://api-us-west-1.rivet.dev/`

## Environment Variables (.env)
```env
RIVET_ENDPOINT=https://rivet-5apq-rivet-5apq-rivet-1m8x:sk_HSCpqV173rK955kttKdqouooeZJgQwD86xMw85LK55BkfyQMYt7LFrmYTyvBQjBM@api-us-west-1.rivet.dev/
```
