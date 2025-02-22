import { Component, Output, EventEmitter } from '@angular/core';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { LayerModel } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { RenderStatusService } from '@auscope/portal-core-ui';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';


@Component({
    selector: '[appCustomPanel]',
    templateUrl: './custompanel.component.html',
    styleUrls: ['../menupanel.scss']
})


export class CustomPanelComponent {

   searchUrl: string;
   loading: boolean;
   statusmsg: string;

   layerGroups: {};
    bsModalRef: BsModalRef;
    @Output() expanded: EventEmitter<any> = new EventEmitter();

    constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
      private modalService: BsModalService, private csMapService: CsMapService, private uiLayerModelService: UILayerModelService) {
      this.loading = false;
      this.statusmsg = 'Enter your WMS service endpoint URL and hit <i class="fa fa-search"></i>';
    }

    public selectTabPanel(layerId: string, panelType: string) {
      this.uiLayerModelService.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
    }
    
    /**
     * Search list of wms layer given the wms url
     */
    public search() {
      this.loading = true;
      this.layerHandlerService.getCustomLayerRecord(this.searchUrl).subscribe(response => {
        this.loading = false;
        if (response != null) {
          this.layerGroups = response;
          if (Object.keys(this.layerGroups).length === 0) {
            this.statusmsg = '<div class="text-danger">No valid layers could be found for this endpoint.</div>';
          } else {
            for (const key in this.layerGroups) {
              for (let i = 0; i < this.layerGroups[key].length; i++) {
                const uiLayerModel = new UILayerModel(this.layerGroups[key][i].id, this.renderStatusService.getStatusBSubject(this.layerGroups[key][i]));
                this.uiLayerModelService.setUILayerModel(this.layerGroups[key][i].id, uiLayerModel);
              }
            }
          }
        } else {
          this.statusmsg = '<div class="text-danger">No viable WMS found on the service endpoint. Kindly check your URL again.</div>';
        }
      });
    }

    /**
     * open the modal that display the status of the render
     */
    public openStatusReport(uiLayerModel: UILayerModel) {
      this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, {class: 'modal-lg'});
      uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
        this.bsModalRef.content.resourceMap = value.resourceMap;
      });
    }

    /**
      * remove a layer from the map
      */
    public removeLayer(layer: LayerModel) {
      this.csMapService.removeLayer(layer);
    }

    /**
     * Retrieve UILayerModel from the UILayerModelService
     * @param layerId ID of layer
     */
    public getUILayerModel(layerId: string): UILayerModel {
      return this.uiLayerModelService.getUILayerModel(layerId);
    }

}
