import { LightningElement, api, wire } from 'lwc';
import { APPLICATION_SCOPE, subscribe, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { getRecord } from 'lightning/uiRecordApi';

const LONGITUDE_FIELD = 'Boat__c.Geolocation__Longitude__s';
const LATITUDE_FIELD = 'Boat__c.Geolocation__Latitude__s';

const BOAT_FIELDS = [LONGITUDE_FIELD, LATITUDE_FIELD];
export default class BoatMap extends LightningElement {
    @wire(MessageContext) messageContext;

    subscription = null;
    boatId;

    @api get recordId() {
        return this.boatId;
    }
    set recordId(value) {
        this.setAttribute('boatId', value);
        this.boatId = value;
    }

    error = undefined;
    mapMarkers = [];

    @wire(getRecord, { recordId: '$boatId', fields: BOAT_FIELDS })
    wiredRecord({ error, data }) {
        // Error handling
        if (data) {
            this.error = undefined;
            const longitude = data.fields.Geolocation__Longitude__s.value;
            const latitude = data.fields.Geolocation__Latitude__s.value;
            this.updateMap(longitude, latitude);
        } else if (error) {
            this.error = error;
            this.boatId = undefined;
            this.mapMarkers = [];
        }
    }

    // Subscribes to the message channel
    subscribeMC() {
        // recordId is populated on Record Pages, and this component
        // should not update when this component is on a record page.
        if (this.subscription || this.recordId) {
            return;
        }

        this.subscription = subscribe(this.messageContext, BOATMC, (message) => {
            this.boatId = message.recordId
        }, { scope: APPLICATION_SCOPE });
    }

    // Calls subscribeMC()
    connectedCallback() {
        this.subscribeMC();
    }

    // Creates the map markers array with the current boat's location for the map.
    updateMap(Longitude, Latitude) {
        this.mapMarkers = [{
            location: {
                latitude: Latitude,
                longitude: Longitude
            }
        }];
    }

    // Getter method for displaying the map component, or a helper method.
    get showMap() {
        return this.mapMarkers.length > 0;
    }
}