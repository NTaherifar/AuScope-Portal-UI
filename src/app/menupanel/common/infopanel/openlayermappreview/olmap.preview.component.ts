import { Constants, CsMapService, OlMapObject, RenderStatusService } from '@auscope/portal-core-ui';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import olStyle from 'ol/style/Style';
import olView from 'ol/View';
import olStroke from 'ol/style/Stroke';
import olFill from 'ol/style/Fill';
import olGeoJSON from 'ol/format/GeoJSON';
import olSourceVector from 'ol/source/Vector';
import olLayerVector from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Polygon from 'ol/geom/Polygon';


@Component({
    selector: 'app-ol-preview-map',
    template: `
    <div id="previewMapElement" #previewMapElement> </div>
    <div style="margin-top: -165px; margin-left: 130px; z-index: -2; position: relative; padding-bottom: 10px; margin-bottom: 64px;">
    <img src="extension/images/loader.gif"></div>
    `,
    styleUrls: ['../../../menupanel.scss']
    // The "#" (template reference variable) matters to access the map element with the ViewChild decorator!
})

export class OlMapPreviewComponent implements AfterViewInit {
    @ViewChild('previewMapElement', { static: true }) mapElement: ElementRef;
    iDiv: any = null;
    new_id: any = null;
    olMapObject: OlMapObject = null;
    bboxGeojsonObjectArr: GeoJSON.FeatureCollection<any>[] = [];
    BBOX_LOW_STROKE_COLOUR = 'black';
    BBOX_HIGH_STROKE_COLOUR = '#ff33cc';
    BBOX_LOW_FILL_COLOUR = 'rgba(128,128,128,0.25)';
    BBOX_HIGH_FILL_COLOUR = 'rgba(255,179,236,0.4)';
    layerVectorArr: { [key: string]: olLayerVector<any> } = {};

    /**
     * This constructor creates the preview map
     */
    constructor(private csMapService: CsMapService, private renderStatusService: RenderStatusService) {
        this.olMapObject = new OlMapObject(renderStatusService, null);
        const map = this.olMapObject.getMap();
        const me = this;

        // When the user clicks on a rectangle in the preview, the main map zooms to the same area
        map.on('singleclick', function(event) {
            for (const featureColl of me.bboxGeojsonObjectArr) {
                for (const feat of featureColl.features) {
                    const poly = new Polygon([[feat.geometry.coordinates[0][0],
                            feat.geometry.coordinates[0][1], feat.geometry.coordinates[0][2],
                            feat.geometry.coordinates[0][3], feat.geometry.coordinates[0][4]]]);
                    if (poly.intersectsCoordinate(event.coordinate)) {
                        me.csMapService.fitView(<[number, number, number, number]>poly.getExtent());
                    }
                }
            }
        });
    }

    /**
     * Set the map target, refresh the map, disable map controls
     */
    ngAfterViewInit() {
        // After view init the map target can be set!
        const map = this.olMapObject.getMap();
        map.setTarget(this.mapElement.nativeElement);

        // Remove controls
        const contrColl = map.getControls();
        for (let i = 0; i < contrColl.getLength(); i++) {
            map.removeControl(contrColl.item(i));
        }
        // Disable pan and zoom via keyboard & mouse
        const actionColl = map.getInteractions();
        for (let i = 0; i < actionColl.getLength(); i++) {
            const action = actionColl.item(i);
            action.setActive(false);
        }
    }

    /**
    * Adds bounding boxes to the preview map, recentres the map to the middle of the bounding boxes
    * @param reCentrePt  Point to re-centre map
    * @param bboxGeojsonObj  Bounding boxes in GeoJSON format
    */
    setupBBoxes(reCentrePt: [number, number], bboxGeojsonObj: { [key: string]: GeoJSON.FeatureCollection<any> }) {
        for (const key in bboxGeojsonObj) {
            // Store the BBOXes for making the main map's view fit to the BBOX when BBOX is clicked on in preview map
            this.bboxGeojsonObjectArr.push(bboxGeojsonObj[key]);

            // Set up bounding box style
            const rectStyle = new olStyle({
                stroke: new olStroke({
                    color: this.BBOX_LOW_STROKE_COLOUR,
                    width: 2
                }),
                fill: new olFill({
                    color: this.BBOX_LOW_FILL_COLOUR
                })
            });
            const source = new olSourceVector({
                features: (new olGeoJSON()).readFeatures(bboxGeojsonObj[key])
            });
            const layerVector = new olLayerVector({
                source: source,
                style: [rectStyle]
            });

            // Keep a record of layers for bbox highlighting function
            this.layerVectorArr[key] = layerVector;

            // Add bounding boxes to map
            this.olMapObject.getMap().addLayer(layerVector);
        }

        // Only re-centre and zoom using valid coordinates, otherwise just recentre to middle of Australia
        let newView: olView;
        if (isNaN(reCentrePt[0]) || isNaN(reCentrePt[1])) {
            newView = new olView({center: Constants.CENTRE_COORD, zoom: 3});
        } else {
            newView = new olView({center: reCentrePt, zoom: 3});
        }
        this.olMapObject.getMap().setView(newView);
    }

   /**
    * Highlights or unhighlights a bounding box in the preview map
    * @param state if true will highlight bounding box, else will unhighlight it
    * @param key used for selecting which bounding box to (un)highlight
    */
   setBBoxHighlight(state: boolean, key: string) {
       const map  = this.olMapObject.getMap();
       let strokeColour: string = this.BBOX_LOW_STROKE_COLOUR;
       let fillColour: string = this.BBOX_LOW_FILL_COLOUR;
       if (state) {
           strokeColour = this.BBOX_HIGH_STROKE_COLOUR;
           fillColour = this.BBOX_HIGH_FILL_COLOUR;
       }
       const layers = map.getLayers();
       // Find the selected layer using the 'layerVectorArry'
       for (const layer of layers.getArray()) {
           if (layer === this.layerVectorArr[key]) {
               // Renew the layer but with a new colour
               map.removeLayer(layer);
               const rectStyle = new olStyle({
                   stroke: new olStroke({
                       color: strokeColour,
                       width: 2
                   }),
                   fill: new olFill({
                       color: fillColour
                   })
               });
               (<olLayerVector<any>>layer).setStyle(rectStyle);
               map.addLayer(layer)
               break;
           }
       }
   }

}
