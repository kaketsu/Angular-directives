/// <amd-dependency path="text!./expiry-time-dropdown.html" />
/// <amd-dependency path="css!./expiry-time-dropdown.css" />
define(["require", "exports", "common/utilities/ElementUtil", "utils/AngularUtil", "text!./expiry-time-dropdown.html", "css!./expiry-time-dropdown.css"], function (require, exports, ElementUtil, AngularUtil) {
    var ExpiryTimeDropdown = (function () {
        function ExpiryTimeDropdown($scope) {
            this.externalReference = this;
            this.$scope = $scope;
        }
        ExpiryTimeDropdown.directive = function () {
            return {
                scope: {
                    externalReference: "=?ref",
                    daysPast: '=?',
                    onChange: '&',
                },
                bindToController: true,
                controller: ExpiryTimeDropdown,
                controllerAs: "self",
                replace: true,
                restrict: "E",
                template: require("text!./expiry-time-dropdown.html"),
                link: function (scope, elem, attributes, controller) {
                    controller.onCreationComplete();
                },
            };
        };
        ExpiryTimeDropdown.prototype.onCreationComplete = function () {
            var _this = this;
            this.clickedOutsideHandler = AngularUtil.createSafeApplyCallback(this.$scope, function (event) { return _this.onMenuClickOutside(event); });
            this.body$ = $("body");
            this.expiryMenu$ = $("#expiry-menu", this.element$);
            this.updateChosenExpiryTime(this.daysPast);
        };
        ExpiryTimeDropdown.prototype.onExpiryMenuClick = function ($event) {
            $event.stopPropagation();
            this.toggleMenu(this.expiryMenu$);
        };
        ExpiryTimeDropdown.prototype.toggleMenu = function (menu$) {
            if (menu$.is(":visible")) {
                this.hideMenu(menu$);
            }
            else {
                this.showMenu(menu$);
            }
        };
        ExpiryTimeDropdown.prototype.showMenu = function (menu$) {
            if (!this.isOpen) {
                this.isOpen = true;
                menu$.fadeIn({ duration: 75 });
                this.body$.on("mousedown", this.clickedOutsideHandler);
            }
        };
        ExpiryTimeDropdown.prototype.hideMenu = function (menu$) {
            var openPropertyName = menu$.attr("name") + "Open";
            if (this.isOpen) {
                this.isOpen = false;
                menu$.fadeOut({ duration: 75 });
                this.body$.off("mousedown", this.clickedOutsideHandler);
            }
        };
        ExpiryTimeDropdown.prototype.onMenuClickOutside = function (event) {
            var clickedOnMenu = ElementUtil.isDescendantOf(this.expiryMenu$, event.target);
            if (!clickedOnMenu) {
                this.hideMenu(this.expiryMenu$);
            }
        };
        ExpiryTimeDropdown.prototype.onExpiryTimeClick = function ($event, daysPast) {
            this.hideMenu(this.expiryMenu$);
            $event.stopPropagation();
            this.updateChosenExpiryTime(daysPast);
            var days = { days: daysPast };
            this.onChange(days);
        };
        ExpiryTimeDropdown.prototype.updateChosenExpiryTime = function (days) {
            switch (days) {
                case 14:
                    this.chosenExpiryName = "fortnight";
                    break;
                case 30:
                    this.chosenExpiryName = "month";
                    break;
                case 90:
                    this.chosenExpiryName = "3 months";
                    break;
                case 180:
                    this.chosenExpiryName = "6 months";
                    break;
                case 365:
                    this.chosenExpiryName = "year";
                    break;
                default:
                case 7:
                    this.chosenExpiryName = "week";
                    break;
            }
        };
        ExpiryTimeDropdown.$inject = ["$scope"];
        return ExpiryTimeDropdown;
    })();
    return ExpiryTimeDropdown;
});
//# sourceMappingURL=ExpiryTimeDropdown.js.map