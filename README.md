# Project description
Fetch data every hour from: <br />
    1. Ilmateenistus API ilmateenistus.ee/ilma_andmed/xml/observations.php <br />
    2. Airviro API air.klab.ee/cgi-bin/iairviro/tsexport.cgi

Fetch data after every 6 hours from: <br />
    1. EHR API devkluster.ehr.ee/api <br />
    2. TIK API socket.tik.teeilm.ee/api

Send data to Azure Events hub.

# Development environment setup
Run `npm install` in 'backend' directory<br>

# Docker
### Build container
```
docker build --progress=plain -t tallinnarcgis .
```
### Run container
```
docker container run -p 80:3000 -d tallinnarcgis
```
### Open bash to container
```
docker container run -it tallinnarcgis bash
```

### Publish
```
docker login tallinnarcgis.azurecr.io
docker tag tallinnarcgis tallinnarcgis.azurecr.io/tallinnarcgis
docker push tallinnarcgis.azurecr.io/tallinnarcgis
```
