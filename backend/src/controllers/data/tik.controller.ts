import https from "https";
import { sendToAzureEventsHub } from "../../azureEventHub";

interface TIKStation {
    id: number,
    name: string,
    geometry: { type: string, coordinates: number[] },
    source: number,
    country: number,
    types?: number[],
    last_observation?: number,
    data?: TIKObservation[]
};

interface TIKObservation {
    ts: number,
    data: {
        d1?: number,
        d3?: number,
        d4?: number,
        d5?: number,
        d6?: number,
        d7?: number,
        d8?: number,
        d9?: number,
        d10?: number,
        d11?: number,
        d12?: number,
        d13?: number,
        d14?: number,
        d15?: number,
        d16?: number,
        d17?: number,
        d18?: number,
        d19?: number,
        d21?: number,
        d23?: number,
        d26?: number,
        d28?: number
    },
    ts_published: number
};

const parameters = [
    {
       id:1,
       parameter:"d1",
       name:"Air Temperature",
       unit:"\u00b0C"
    },
    {
       id:3,
       parameter:"d3",
       name:"Air Pressure",
       unit:"mbar"
    },
    {
       id:4,
       parameter:"d4",
       name:"Road Surface Condition",
       description:"See possible values and their description in API documentation"
    },
    {
       id:5,
       parameter:"d5",
       name:"Road Surface Temperature",
       unit:"\u00b0C"
    },
    {
       id:6,
       parameter:"d6",
       name:"Dew point",
       unit:"\u00b0C"
    },
    {
       id:7,
       parameter:"d7",
       name:"Wind Speed",
       unit:"m\/s",
       description:"Average wind speed across all measurements in data collection interval"
    },
    {
       id:8,
       parameter:"d8",
       name:"Precipitation Intensity",
       unit:"mm\/h",
       description:"Total amount of precipitation in 1 minute converted to 1 hour intensity"
    },
    {
       id:9,
       parameter:"d9",
       name:"Precipitation Type",
       description:"See possible values and their description in API documentation"
    },
    {
       id:10,
       parameter:"d10",
       name:"Relative Humidity",
       unit:"%"
    },
    {
       id:11,
       parameter:"d11",
       name:"Wind Direction",
       unit:"deg"
    },
    {
       id:12,
       parameter:"d12",
       name:"Road Temperature - Dew Point",
       unit:"\u00b0C",
       description:"Road temperature minus dew point, postive values indicate that road is drying, while negative values indciate that road is collecting moisture"
    },
    {
       id:13,
       parameter:"d13",
       name:"Friction",
       description:"Road slipperiness indicator, values from 0 (no fricton) to 1 (absolute friction)"
    },
    {
       id:14,
       parameter:"d14",
       name:"Visibility",
       unit:"m",
       description:"Range of visiblity, values from 0 to 2000 m"
    },
    {
       id:16,
       parameter:"d16",
       name:"Wind Gusts",
       unit:"m\/s",
       description:"Strongest wind registered within data collection interval"
    },
    {
       id:17,
       parameter:"d17",
       name:"Precipitation Sum",
       unit:"mm",
       description:"Daily precipitation sum - summarizes all precipitation amounts starting from 06:00 AM (EEST)"
    },
    {
       id:18,
       parameter:"d18",
       name:"Water Layer",
       unit:"mm",
       description:"Water layer on top of road surface"
    },
    {
       id:19,
       parameter:"d19",
       name:"Ground Temperature",
       unit:"\u00b0C",
       description:"Ground temperature measured at a depth of 6 cm below the road surface"
    },
    {
       id:21,
       parameter:"d21",
       name:"Salt Amount",
       unit:"g\/m\u00b2",
       description:"Salt amount on top of the road surface"
    },
    {
       id:23,
       parameter:"d23",
       name:"Cloud coverage",
       unit:"okta",
       description:"Cloud coverage estimated in terms of how many eighths of the sky are covered in cloud, ranging from 0 oktas (completely clear sky) through to 8 oktas (completely overcast)"
    },
    {
       id:26,
       parameter:"d26",
       name:"Weather Symbol",
       description:"See possible values and their description in API documentation"
    },
    {
       id:28,
       parameter:"d28",
       name:"Precipitation Amount",
       unit:"mm"
    }
];

// Get TIK data -> convert to JSON -> Create and format data array -> send to Azure Eventpipeline
export const TIKDataInterval = async () => {

    // Time in seconds - 6hours(pervious request time)
    const seconds = Math.round(Date.now()/1000)-21600;

    // Final data
    const finalTIKStationArray: TIKStation[] = [];

    const TIKConnectionString:string = process.env.TIK_CONNECTIONSTRING!;
    const TIKEventHubName:string = process.env.TIK_EVENT_HUB!;
    const TIKAPIKEY = process.env.TIKAPIKEY;
  
    https.get(`https://socket.tik.teeilm.ee/api/sites?apikey=${TIKAPIKEY}`, function (response) {
        let siteData: string = "";

        response.on("data", function (stream) {
            siteData += stream;
        });

        response.on("end", async function () {  
            // Parse data and 
            const parsedSiteData = JSON.parse(siteData);

            // We are allowed to create 12 requests a minute so we have to sleep for 10 seconds after every request
            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
            console.log(parsedSiteData.length)
            for(let i = 0; i < parsedSiteData.length; i++){
                // If country is Estonia
                if(parsedSiteData[i].country === 1){
                    await getObservation(parsedSiteData[i]);
                };
                await sleep(10000);
                console.log(i);
            };

            // Send finalTIKStationArray to azure event pipe
            console.log("finalTIKStationArray", finalTIKStationArray)

            await sendToAzureEventsHub(finalTIKStationArray, TIKConnectionString, TIKEventHubName).catch((err) => {
                console.log({ error: `Send data to Eventpipeline ${err}`})
            });
            console.log({ message: `Data sent to Eventpipeline`})
        });

        response.on("error", (error) => {
            console.log("Error while receving data from TIK sites API.", error);
        });
    });

    async function getObservation(station: TIKStation){
        // Create request to get station observations from given TS
        https.get(`https://socket.tik.teeilm.ee/api/observations?site=${station.id}&from=${seconds}&apikey=${TIKAPIKEY}`, function (response) {

            let observationData: string = "";
            station.data = [];

            response.on("data", function (siteStream) {
                observationData += siteStream;
            });

            response.on("end", async function () {
                // Parse the results and loop all station data points
                const parasedObservationData = JSON.parse(observationData)

                parasedObservationData?.result[0]?.observations?.forEach((observation: TIKObservation) => {
                    for (const [key, value] of Object.entries(observation.data)) {
                        // If value is empty then delete the property
                        if(!value){
                            delete observation[key];
                        };
        
                        // Find and add predefined readable parameters to data
                        let params = parameters.find(
                            (val) => val.parameter === key
                        );

                        // Add found parameters to data
                        if(params){
                            if(value){
                                observation.data[key] = {
                                    value: value, 
                                    unit: params.unit,
                                    key: params.name
                                };
                            } else {
                                // If value is empty then delete the property
                                delete observation[key];
                            }
                        };
                    };
                    // Add observation data to station
                    station.data.push(observation);
                });
                // If all data points are added to station then add station to final array that is sent to Azure
                finalTIKStationArray.push(station);
            });

            response.on("error", (error) => {
                console.log("Error while receving data from TIK observations API.", error);
            });
        });
    };
};