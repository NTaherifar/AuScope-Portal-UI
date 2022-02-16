import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { LayerModel, OnlineResourceModel, QuerierInfoModel } from '@auscope/portal-core-ui';
import { MSCLService } from '../../../layeranalytic/mscl/mscl.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MSCLAnalyticComponent } from '../../../layeranalytic/mscl/mscl.analytic.component';

@Component({
  selector: 'app-mscl',
  templateUrl: './mscl.component.html',
  styleUrls: ['./mscl.component.scss'],
  providers: [MSCLService]
})
export class MSCLComponent implements OnInit {

    @Input() layer: LayerModel;
    @Input() onlineResource: OnlineResourceModel;
    @Input() featureId: string;
    @Input() doc: QuerierInfoModel;

    public msclform: any; // Used to store form data
    public metricList: string[]; // List of metrics selected by user
    public allMetricList: string[];  // List of all possible metrics
    public modalDisplayed = false; // Is modal dialogue displayed?
    public allTicked = false; // Are all tickboxes ticked?
    public showSelectMetricError: boolean; // Show error if no metrics chosen when Draw Graph is pressed

    private bsModalRef: BsModalRef;

    constructor(public msclService: MSCLService, private modalService: BsModalService, private changeDetectorRef: ChangeDetectorRef) {
        this.msclform = {};
        this.allMetricList = this.msclService.getMetricList();
    }

    ngOnInit() {
        // Initialise form data
        this.msclform.startDepth = 0;
        this.msclform.endDepth = 2000;
        this.msclform.bMetric = {};
        this.showSelectMetricError = false;
        for (const metric of this.allMetricList) {
            this.msclform.bMetric[metric] = false;
        }
    }

    /**
     * Sets all tickboxes to be same as 'ALL' tickbox
     */
    public toggle_all_chkbox() {
        for (const metric of this.allMetricList) {
            this.msclform.bMetric[metric] = this.allTicked;
        }
    }

    /**
     * Creates a modal dialogue which contains plots of MSCL data
     */
    public createGraphModal() {
        this.metricList = [];
        for (const metric of this.allMetricList) {
            if (this.msclform.bMetric[metric]) {
                this.metricList.push(metric);
            }
        }
        if (this.metricList.length === 0) {
            this.showSelectMetricError = true;
        } else if (this.modalDisplayed === false) {
            this.showSelectMetricError = false;
            // Create the dialogue with relevant input parameters
            this.bsModalRef = this.modalService.show(MSCLAnalyticComponent, {
                class: 'modal-xl',
                ignoreBackdropClick: true,
                keyboard: false,
                initialState: {
                    'startDepth': this.msclform.startDepth,
                    'endDepth': this.msclform.endDepth,
                    'metricList': this.metricList,
                    'featureId': this.featureId,
                    'closeGraphModal': this.closeGraphModal.bind(this),
                    'serviceUrl': this.onlineResource.url
                }
            });
            this.modalDisplayed = true;
        }
        this.changeDetectorRef.detectChanges();
    }

    /**
     */
    public closeGraphModal() {
        if (this.modalDisplayed) {
            this.bsModalRef.hide();
            this.modalDisplayed = false;
        }
    }
}
