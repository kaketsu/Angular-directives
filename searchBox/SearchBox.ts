/// <amd-dependency path="text!./search-box.html" />
/// <amd-dependency path="css!./search-box.css" />

import ArrayHelper = require("common/utilities/ArrayHelper");
import ElementUtil = require("common/utilities/ElementUtil");
import DashboardUIManager = require("ep/displayLogic/dashboard/DashboardUIManager");
import ContentSearchAction = require("ep/logic/search/ContentSearchAction");
import SessionManager = require("ep/logic/session/SessionManager");
import NavigationService = require("ep/ui/navigation/NavigationService");
import AngularUtil = require("utils/AngularUtil");
import ContentSearchRequest = services.ContentSearch.BusinessObjects.ContentSearchRequest;
import LanguageLink = services.LPLogin.BusinessObjects.LanguageLink;

interface IFields
{
    epSearchBoxInput: HTMLInputElement;
}

class SearchBox
{
    public static directive(): ng.IDirective
    {
        return {
            scope: {
                externalReference: "=?ref",
            },
            bindToController: true,
            controller: SearchBox,
            controllerAs: "self",
            restrict: "E",
            replace: true,
            template: require("text!./search-box.html"),
            transclude: true,
            link: (scope: ng.IScope, elem: JQuery, attributes: ng.IAttributes, controller: SearchBox) =>
            {
                controller.onCreationComplete(elem);
            },
        };
    }

    private externalReference: SearchBox;
    private $scope: ng.IScope;
    protected navigationService: NavigationService;
    protected dashboardUIManager: DashboardUIManager;
    protected sessionManager: SessionManager;
    private $timeout: ng.ITimeoutService;
    private $locationService: ng.ILocationService;

    private fields: IFields;

    private contentSearchAction: ContentSearchAction;
    private subjectDescription: string;
    private recentSubjects: LanguageLink[];

    private searchPlaceHolder: string;

    static $inject = ["$scope",
        "$timeout",
        "$location",
        "navigationService",
        "dashboardUIManager",
        "sessionManager",
    ]
    constructor($scope,
        $timeout: ng.ITimeoutService,
        $location: ng.ILocationService,
        navigationService: NavigationService,
        dashboardUIManager: DashboardUIManager,
        sessionManager: SessionManager)
    {
        this.$scope = $scope;
        this.externalReference = this;
        this.navigationService = navigationService;
        this.dashboardUIManager = dashboardUIManager;
        this.sessionManager = sessionManager;
        this.$timeout = $timeout;
        this.$locationService = $location;
    }

    public get searchText(): string
    {
        return this.dashboardUIManager.searchText;
    }

    public set searchText(searchText: string)
    {
        this.dashboardUIManager.searchText = searchText;
    }

    private onCreationComplete(elem: JQuery)
    {
        this.fields = ElementUtil.getTyped<IFields>(["ep-search-box-input"], elem);

        $("#ep-search-box-button, .search-subject-option").on("mouseup touchend", () => this.fields.epSearchBoxInput.focus());

        this.dashboardUIManager.forceOpenSearchBoxEvent.addEventListener(this.onForceOpen, this);
        this.$scope.$on("$destroy", () => this.cleanUp());
    }

    private cleanUp()
    {
        this.dashboardUIManager && this.dashboardUIManager.forceOpenSearchBoxEvent.removeEventListener(this.onForceOpen);
    }

    private get subjects(): LanguageLink[]
    {
        if (this.dashboardUIManager)
        {
            if (this.dashboardUIManager.selectedClass.isExploreClass && this.dashboardUIManager.selectedClass.userSelectedSubject)
            {
                return [this.dashboardUIManager.selectedClass.userSelectedSubject];
            }
            else
            {
                return this.dashboardUIManager.recentSubjects;
            }
        }
        return [];
    }

    private apply(action: () => void)
    {
        AngularUtil.safeApply(this.$scope, action);
    }

    private onForceOpen(event: void): void
    {
        if (this.dashboardUIManager.contentSearchResult && this.dashboardUIManager.contentSearchResult.SearchTermsUsed.trim() != "")
        {
            this.$timeout(() =>
            {
                if (this.dashboardUIManager.contentSearchResult)
                {
                    this.searchText = this.dashboardUIManager.contentSearchResult.SearchTermsUsed;
                }
                this.dashboardUIManager.searchBarOpen = true;
            });
        }
    }

    private onMouseUpInBox(e): void
    {
        e.stopPropagation();
    }

    private onMouseUpElsewhere(e): void
    {
        this.$timeout(() =>
        {
            if (this.dashboardUIManager.searchBarOpen && (this.searchText === undefined || this.searchText.trim() == ""))
            {
                this.dashboardUIManager.searchBarOpen = false;

                $(".ep-search-box").off("mouseup touchend");
                $(document).off("mouseup touchend");
            }
        }, 100);
    }

    private submitSearch(e: JQueryEventObject): void
    {
        if (this.searchText === undefined || this.searchText.trim() == "")
        {
            this.dashboardUIManager.contentSearchResult = undefined;

            if (this.dashboardUIManager.selectedClass)
            {
                this.navigationService.displayDashboardClassPage(this.dashboardUIManager.selectedClass.id);
            }
            return;
        }

        if (e.keyCode == 13) // Enter
        {
            if (this.subjects)
            {
                this.getSearchResultFromServer(this.searchText);
            }
        }

    }

    private onSearchButtonClick(): void
    {
        if (this.searchText === undefined || this.searchText.trim() == "")
        {
            this.dashboardUIManager.contentSearchResult = undefined;

            if (this.dashboardUIManager.selectedClass)
            {
                this.navigationService.displayDashboardClassPage(this.dashboardUIManager.selectedClass.id);
            }
            return;
        }
        else
        {
            if (this.subjects)
            {
                this.getSearchResultFromServer(this.searchText);
            }
        }
    }

    private getSearchResultFromServer(searchText: string): void
    {
        var targetSubjects: number[] = <number[]>ArrayHelper.createArrayOfPropertiesFromItems(this.subjects, "ID");

        var request: ContentSearchRequest = {
            TargetSubjects: targetSubjects,
            BaseLanguage: 0,
            NumberOfResults: 20,
            SchoolID: this.dashboardUIManager.selectedClass.schoolID,
            SearchPersonalContent: true,
            SearchPublicContent: true,
            SearchSchoolContent: true,
            SearchText: this.searchText,
            IncludeFacets: false,
            Offset: 0,

            //
            FilteredCurriculum: -1,
            FilteredCurriculumLevel: -1,
            FilteredCurriculumStandard: -1,
            FilteredCurriculumSubject: -1,
            FilteredModules: [],
            FilteredTags: [],
            FilteredContentListActivityTypes: [],
            ResultTypes: null
        };

        this.contentSearchAction = new ContentSearchAction(this.sessionManager.sessionID, request);
        this.contentSearchAction.setCompletionFunction(this.onGetContentSearchResult, this);
        this.contentSearchAction.execute();
    }

    private onGetContentSearchResult(action: ContentSearchAction)
    {
        if (action.successful)
        {
            this.dashboardUIManager.contentSearchResult = action.contentSearchResult;
            this.dashboardUIManager.title = "Search Results";
            this.navigationService.displayDashboardSearchResultPage(this.searchText);
            this.fields.epSearchBoxInput.blur();
        }
        else
        {
            console.log(action.faultMessage);
        }
    }

    protected startSearch(): void
    {
        this.$timeout(() =>
        {
            $(".ep-search-box").on("mouseup touchend", this.onMouseUpInBox.bind(this));
            $(document).on("mouseup touchend", this.onMouseUpElsewhere.bind(this));
        });
    }

    protected showKeyboard(): void
    {
        this.fields.epSearchBoxInput.focus();
    }
}

export = SearchBox;