/// <amd-dependency path="text!./expiry-time-dropdown.html" />
/// <amd-dependency path="css!./expiry-time-dropdown.css" />

import ElementUtil = require("common/utilities/ElementUtil");
import AngularUtil = require("utils/AngularUtil");

class ExpiryTimeDropdown
{
    public static directive(): ng.IDirective
    {
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
            link: (scope: ng.IScope, elem: JQuery, attributes: ng.IAttributes, controller: ExpiryTimeDropdown) =>
            {
                controller.onCreationComplete();
            },
        };
    }

    private externalReference: ExpiryTimeDropdown;
    private $scope: ng.IScope;

    private daysPast: number;
    private chosenExpiryName: string;

    protected expiryMenu$: JQuery;
    protected element$: JQuery;
    protected clickedOutsideHandler: () => void;
    protected body$: JQuery;
    protected isOpen: boolean;
    protected onChange: (days: IPastDays) => void;

    static $inject = ["$scope"];
    constructor($scope: ng.IScope)
    {
        this.externalReference = this;
        this.$scope = $scope;
    }

    private onCreationComplete()
    {
        this.clickedOutsideHandler = AngularUtil.createSafeApplyCallback(this.$scope, (event) => this.onMenuClickOutside(event));
        this.body$ = $("body");
        this.expiryMenu$ = $("#expiry-menu", this.element$);
        this.updateChosenExpiryTime(this.daysPast);
    }

    protected onExpiryMenuClick($event: JQueryEventObject)
    {
        $event.stopPropagation();
        this.toggleMenu(this.expiryMenu$);
    }

    protected toggleMenu(menu$: JQuery)
    {
        if (menu$.is(":visible"))
        {
            this.hideMenu(menu$);
        }
        else
        {
            this.showMenu(menu$);
        }
    }

    protected showMenu(menu$: JQuery)
    {
        if (!this.isOpen)
        {
            this.isOpen = true;
            menu$.fadeIn({ duration: 75 });
            this.body$.on("mousedown", this.clickedOutsideHandler);
        }
    }

    protected hideMenu(menu$: JQuery)
    {
        var openPropertyName: string = menu$.attr("name") + "Open";
        if (this.isOpen)
        {
            this.isOpen = false;
            menu$.fadeOut({ duration: 75 });
            this.body$.off("mousedown", this.clickedOutsideHandler);
        }
    }

    protected onMenuClickOutside(event: JQueryEventObject)
    {
        var clickedOnMenu: boolean = ElementUtil.isDescendantOf(this.expiryMenu$, event.target);

        if (!clickedOnMenu)
        {
            this.hideMenu(this.expiryMenu$);
        }
    }

    private onExpiryTimeClick($event: JQueryEventObject, daysPast: number)
    {
        this.hideMenu(this.expiryMenu$);
        $event.stopPropagation();

        this.updateChosenExpiryTime(daysPast);

        var days: IPastDays = { days: daysPast };

        this.onChange(days);
    }

    private updateChosenExpiryTime(days: number)
    {
        switch (days)
        {
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
    }
}

export = ExpiryTimeDropdown;

interface IPastDays
{
    days: number;
}