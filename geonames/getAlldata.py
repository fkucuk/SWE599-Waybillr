#The script to pull Turkey's administrative divisions hierarchically

import json
import xml.etree.ElementTree as ET
import requests

#print(response.text)

def writeXMLtoFile(filename, xml):
    filename = filename + ".xml"
    file = open(filename, "w")
    file.writelines(xml)
    file.close()



def getChildrenXMLByGeoID(geoID):
    url = "http://api.geonames.org/children?geonameId=" + str(geoID) + "&username=fkucuk"
    response = requests.get(url)
    return response

response = getChildrenXMLByGeoID(298795)

writeXMLtoFile("TR", response.text)

tree = ET.fromstring(response.content)

for geo in tree.findall('geoname'):
    geoID = geo.find("geonameId").text
    name = geo.find("toponymName").text
    print(name + " - " + geoID)
    response = getChildrenXMLByGeoID(geoID)
    writeXMLtoFile(name, response.text)


