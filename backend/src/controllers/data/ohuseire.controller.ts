import { NextFunction, Request, Response } from "express";
import https from "https";
import { sendToAzureEventsHub } from "../../azureEventHub";
const utmObj = require("utm-latlng");


interface IAirViroMeasurement {
    value:string,
    name: string,
    unit: string,
}

interface IAirViroLocations {
    key: string,
    name: string,
    latitude: number,
    longitude: number,
    measurements:IAirViroMeasurement[]
}


interface AirViroParameters {
    key: string;
    name: string;
    unit: string;
}

const airViroParameters: AirViroParameters[] = [
    {
      key: "0001",
      name: "SO2",
      unit: "ppb",
    },
    {
      key: "0003",
      name: "NO2",
      unit: "ppb",
    },
    {
      key: "0004",
      name: "CO",
      unit: "ppb",
    },
    {
      key: "0008",
      name: "O3",
      unit: "ppb",
    },
    {
      key: "PM10",
      name: "PM10",
      unit: "µg/m3",
    },
];
  

// Get ohuseire(Airviro) data -> send to Azure Eventpipeline
export const airviroDataInterval = async () => {
    let bufferString: Uint8Array[] = [];
    let finalResults: IAirViroLocations[] = [];
  
    // set and format local dateTime
    const currentDate = new Date();
    const timeZone = "Europe/Tallinn";
    const formatter = new Intl.DateTimeFormat("en", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      timeZone,
      hour12: false,
    });
  
    const formattedComponents = formatter.formatToParts(currentDate);
    const year = formattedComponents.find((part) => part.type === "year")?.value;
    const month = formattedComponents.find((part) => part.type === "month")?.value;
    const day = formattedComponents.find((part) => part.type === "day")?.value;
    const hour = (parseInt(formattedComponents.find((part) => part.type === "hour")!.value) - 1).toString().padStart(2, "0");
  
    const dateString = `${year}${month}${day}${hour}`;
  
    const ohuseireUser: string = process.env.OHUSEIRE_USER!;
    const ohuseirePassword: string = process.env.OHUSEIRE_PASSWORD!;
    const data = `${ohuseireUser}\n${ohuseirePassword}\n#DOMAIN Eesti\n#STN S00 S01 S16 S20\nEOF`;
    const ohuseireConnectionString:string = process.env.OHUSEIRE_CONNECTIONSTRING!;
    const ohuseireEventHubName:string = process.env.OHUSEIRE_EVENT_HUB!;
    
    let options = {
      hostname: "air.klab.ee",
      path: "/cgi-bin/iairviro/stnexport.cgi",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data),
      },
    };
  
    const stnExportReq = https.request(options, (resp) => {
      resp
        .on("data", async (chunk) => {
          // Push all chunks to Uint8Array
          bufferString.push(chunk);
        })
        .on("end", () => {
          // When all data chunks are stored
          let data = Buffer.concat(bufferString).toString();
  
          // At this point, `bufferString` has all the chunks stored in as a string
          // JSON.parse the bufferString
          let finalData = JSON.parse(data);
  
          // Create array from bufferString
          finalData.forEach((elem: any) => {
            // Convert from UTM to latitude/longitude coordinates.
            const utm = new utmObj();
            const newCoords = utm.convertUtmToLatLng(
              elem.coord[0],
              elem.coord[1],
              35,
              "V"
            );
            finalResults.push({
              key: elem.key,
              name: elem.name,
              latitude: newCoords.lat,
              longitude: newCoords.lng - 3, // utm converter converts +3 longitude for some reason
              measurements: [],
            });
          });
          (async () => {
            for (const finalResult of finalResults) {
              for (const parameter of airViroParameters) {
                bufferString = [];
                const dataArr: any[] = await fetchData(finalResult, parameter);
  
                // Process the dataArr and update finalResults as needed
                finalResult.measurements.push({
                  value: dataArr[2],
                  name: parameter.name,
                  unit: parameter.unit,
                });
              };
            };
            sendData(finalResults);
          })();
  
          // Fetch latest data from stations
          async function fetchData(
            element: IAirViroLocations,
            parameter: AirViroParameters
          ) {
            return new Promise<any>((resolve, reject) => {
              data = `${ohuseireUser}\n${ohuseirePassword}\nEesti\n${element.key}+M${parameter.key}000 0\n${dateString}\n${dateString}\nEOF`;
              options = {
                hostname: "air.klab.ee",
                path: "/cgi-bin/iairviro/tsexport.cgi",
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Content-Length": Buffer.byteLength(data),
                },
              };
  
              const tsExportReq = https.request(options, (resp) => {
                bufferString = [];
                resp
                  .on("data", (chunk) => {
                    bufferString.push(chunk);
                  })
                  .on("end", () => {
                    let data = Buffer.concat(bufferString).toString();
                    const regex = /EOH\n([\s\S]*?)\nEOF/;
                    const dataValue = regex.exec(data);
                    if (dataValue) {
                      const extractedLine = dataValue[1];
                      const dataArr = extractedLine.split(",");
                      resolve(dataArr);
                    }
                  })
                  .on("error", (error) => {
                    reject(error);
                  });
              });
  
              tsExportReq.write(data);
              tsExportReq.end();
            });
          }
        });
    });
  
    stnExportReq.on("error", (error) => {
      return `Get Ohuseire error : ${error}`;
    });
  
    stnExportReq.write(data);
  
    async function sendData(data:IAirViroLocations[]) {
      stnExportReq.end();
      await sendToAzureEventsHub(data, ohuseireConnectionString, ohuseireEventHubName).catch((err) => {
        console.log({ error: `Send data to Eventpipeline ${err}`})
      });
      console.log({ message: `Data sent to Eventpipeline`})
    };
  };