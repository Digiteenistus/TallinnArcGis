import https from "https";
const buildings:string[] = require('../../files/buildingsData.json');
const utmObj = require("utm-latlng");
import { sendToAzureEventsHub } from "../../azureEventHub";

const ehrConnectionString:string = process.env.EHR_CONNECTIONSTRING!;
const ehrEventHubName:string = process.env.EHR_EVENT_HUB!;

// Create EHR codes payload double array from buildingsData.json file. 20 codes in each payloadArray element
let payloadArray: string[][] = [];
export const ehrDataInterval =() => {
    for(let i = 0; i <= buildings.length;i=i+20){
        payloadArray.push(buildings.slice(i, i+20));
        // If we are reaching to the end of buildingsData.json file, check how many there is left and push leftovers to array and finish loop
        if(buildings.length - i < 21){
            payloadArray.push(buildings.slice(i, buildings.length - i+1));
            i = buildings.length;
        };
        // Fetch data from EHR API, send array of EHR codes(20 per request)
        if(i >= buildings.length){
            // For some reason the last element of this array is empty - delete this using pop()
            payloadArray.pop();
            fetchEhrData(payloadArray[0]);
        };
    };
};

let count = 0;
// Get EHR data -> send to Azure Eventpipeline (20 buildings per request)
export const fetchEhrData = async  (ehrCodes:string[]) => {
    // Final array
    let finalEhrData: {address: string, lat: number, long: number, energyLabel: string, ehrCode: string}[] = [];

    const requestData = JSON.stringify({ ehrCodes });
    const options = {
        hostname: 'devkluster.ehr.ee',
        path: '/api/building/v2/buildingsData',
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            // Process the response here
            const datass = JSON.parse(responseData)
        
            datass.forEach((element:any) => {

                // Convert from UTM to latitude/longitude coordinates.
                const utm = new utmObj();
                const newCoords = utm.convertUtmToLatLng(
                    element.ehitis.ehitiseKujud.ruumikuju[0].viitepunktX,
                    element.ehitis.ehitiseKujud.ruumikuju[0].viitepunktY,
                    35,
                    "V"
                );

                // Create object and push to final array
                // TODO utm converter converts a bit wrong values for some reason
                finalEhrData.push({
                    address: element.ehitis.ehitiseAndmed.taisaadress,
                    lat: newCoords.lat - 0.00070827302182,
                    long: newCoords.lng - 3.00032531126542,
                    energyLabel: element.ehitis.ehitiseEnergiamargised.energiamargis[0]?.energiaKlass,
                    ehrCode: element.ehitis.ehitiseAndmed.ehrKood
                });
            });

            sendData(finalEhrData);

            // After processing the response, delete payload from array and send the next request
            count ++;
            const remainingEhrCodes = payloadArray.splice(0, count);
            if (remainingEhrCodes.length > 0) {
                fetchEhrData(remainingEhrCodes[0]);
            };
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.write(requestData);
    req.end();
    
    async function sendData(data: {address: string, lat: number, long: number, energyLabel: string, ehrCode: string}[]) {
        await sendToAzureEventsHub(data, ehrConnectionString, ehrEventHubName).catch((err) => {
          console.log({ error: `Send data to Eventpipeline ${err}`})
        });
        console.log({ message: `Data sent to Eventpipeline`})
      };
};
