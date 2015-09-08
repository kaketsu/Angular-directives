/// <amd-dependency path="text!./help-dialog.html" />
/// <amd-dependency path="css!./help-dialog.css" />

import BaseDialog = require("controlPanel/components/shared/BaseDialog");
import DepartmentRoles = require("controlPanel/shared/crm/DepartmentRoles");
import HelpContexts = require("controlPanel/shared/help/HelpContexts");
import HelpService = require("controlPanel/shared/help/HelpService");
import IVideoItem = require("controlPanel/shared/help/IVideoItem");
import Portals = require("controlPanel/shared/Portals");

class HelpDialog extends BaseDialog
{
    public static directive(): ng.IDirective
    {
        return BaseDialog.directive({
            controller: HelpDialog,
            template: require("text!./help-dialog.html"),
        });
    }

    // angular vars
    private helpService: HelpService;
    protected videoElem: HTMLVideoElement;
    protected url: string;
    protected context: HelpContexts;
    protected subContext: string;
    protected autoPlay: boolean;
    protected isTour: boolean;
    protected title: string;
    protected department: string = "";
    protected brand: string = "EducationPerfect";

    static $inject = ["$scope", "$timeout", "portals", "helpService"];
    constructor($scope: ng.IScope, $timeout: ng.ITimeoutService, portals: Portals, helpService: HelpService)
    {
        super($scope, $timeout, portals);

        this.helpService = helpService;
    }

    protected onCreationComplete(elem: JQuery)
    {
        this.videoElem = <HTMLVideoElement>document.getElementById("video-player");
        //(<any>$("#video-player")).objectFit({ type: 'cover', hideOverflow: false });
    }

    public presetDialogForDisplay(context: HelpContexts, subContext: string, autoPlay: boolean = false)
    {
        this.clear();

        this.context = context;
        this.subContext = subContext;
        this.isTour = context == HelpContexts.TOUR;
        this.autoPlay = autoPlay;

        var videoItem: IVideoItem = this.helpService.getDefaultTourVideoToPlay(this.context);

        this.url = videoItem.url;
        this.title = videoItem.title;
    }

    public get departmentIDs(): number[]
    {
        return this.portals.departmentIDs;
    }

    public show()
    {
        for (var i: number = 0; i < this.departmentIDs.length; i++)
        {
            switch (this.departmentIDs[i])
            {
                case DepartmentRoles.ENGLISH:
                    this.brand = "EducationPerfect";
                    this.department = "English";
                    break;
                case DepartmentRoles.MATHS:
                    this.brand = "EducationPerfect";
                    this.department = "Maths";
                    break;
                case DepartmentRoles.SCIENCE:
                    this.brand = "EducationPerfect";
                    this.department = "Science";
                    break;
                case DepartmentRoles.SOCIAL_SCIENCES:
                    this.brand = "EducationPerfect";
                    this.department = "Social Sciences";
                    break;
                case DepartmentRoles.ESOL_EAL:
                    this.brand = "EducationPerfect";
                    this.department = "ESOL/EAL";
                case DepartmentRoles.LANGUAGES:
                    this.brand = "LanguagePerfect"
                    this.department = "";
                    break;
            }

            if (this.brand === "EducationPerfect")
            {
                break;
            }
        }

        this.videoElem.src = this.url;

        if (this.autoPlay)
        {
            this.videoElem.play();
        }

        this.shown = true;
    }

    public hide()
    {
        this.videoElem.pause();
        this.shown = false;
        this.clear();
    }

    private clear()
    {
        this.context = null;
        this.subContext = null;
        this.autoPlay = false;
        this.isTour = false;
    }
}

export = HelpDialog;
