/// <amd-dependency path="text!./help-dialog.html" />
/// <amd-dependency path="css!./help-dialog.css" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "controlPanel/components/shared/BaseDialog", "text!./help-dialog.html", "css!./help-dialog.css"], function (require, exports, BaseDialog) {
    var HelpDialog = (function (_super) {
        __extends(HelpDialog, _super);
        function HelpDialog($scope, $timeout, portals, helpService) {
            _super.call(this, $scope, $timeout, portals);
            this.department = "";
            this.brand = "EducationPerfect";
            this.helpService = helpService;
        }
        HelpDialog.directive = function () {
            return BaseDialog.directive({
                controller: HelpDialog,
                template: require("text!./help-dialog.html"),
            });
        };
        HelpDialog.prototype.onCreationComplete = function (elem) {
            this.videoElem = document.getElementById("video-player");
            //(<any>$("#video-player")).objectFit({ type: 'cover', hideOverflow: false });
        };
        HelpDialog.prototype.presetDialogForDisplay = function (context, subContext, autoPlay) {
            if (autoPlay === void 0) { autoPlay = false; }
            this.clear();
            this.context = context;
            this.subContext = subContext;
            this.isTour = context == 1 /* TOUR */;
            this.autoPlay = autoPlay;
            var videoItem = this.helpService.getDefaultTourVideoToPlay(this.context);
            this.url = videoItem.url;
            this.title = videoItem.title;
        };
        Object.defineProperty(HelpDialog.prototype, "departmentIDs", {
            get: function () {
                return this.portals.departmentIDs;
            },
            enumerable: true,
            configurable: true
        });
        HelpDialog.prototype.show = function () {
            for (var i = 0; i < this.departmentIDs.length; i++) {
                switch (this.departmentIDs[i]) {
                    case 6 /* ENGLISH */:
                        this.brand = "EducationPerfect";
                        this.department = "English";
                        break;
                    case 9 /* MATHS */:
                        this.brand = "EducationPerfect";
                        this.department = "Maths";
                        break;
                    case 5 /* SCIENCE */:
                        this.brand = "EducationPerfect";
                        this.department = "Science";
                        break;
                    case 16 /* SOCIAL_SCIENCES */:
                        this.brand = "EducationPerfect";
                        this.department = "Social Sciences";
                        break;
                    case 18 /* ESOL_EAL */:
                        this.brand = "EducationPerfect";
                        this.department = "ESOL/EAL";
                    case 4 /* LANGUAGES */:
                        this.brand = "LanguagePerfect";
                        this.department = "";
                        break;
                }
                if (this.brand === "EducationPerfect") {
                    break;
                }
            }
            this.videoElem.src = this.url;
            if (this.autoPlay) {
                this.videoElem.play();
            }
            this.shown = true;
        };
        HelpDialog.prototype.hide = function () {
            this.videoElem.pause();
            this.shown = false;
            this.clear();
        };
        HelpDialog.prototype.clear = function () {
            this.context = null;
            this.subContext = null;
            this.autoPlay = false;
            this.isTour = false;
        };
        HelpDialog.$inject = ["$scope", "$timeout", "portals", "helpService"];
        return HelpDialog;
    })(BaseDialog);
    return HelpDialog;
});
//# sourceMappingURL=HelpDialog.js.map