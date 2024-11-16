# nowhere-player-client

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/avandeventer/nowhere-player-client)

npm run build
docker build -t us-east4-docker.pkg.dev/nowhere-af065/nowhere-player-client-repo/nowhere-player-client .
docker push us-east4-docker.pkg.dev/nowhere-af065/nowhere-player-client-repo/nowhere-player-client    
gcloud run deploy nowhere-player-client --image us-east4-docker.pkg.dev/nowhere-af065/nowhere-player-client-repo/nowhere-player-client --platform managed --region us-east4 --allow-unauthenticated