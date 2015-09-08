/// <amd-dependency path="text!./search-box.html" />
/// <amd-dependency path="css!./search-box.css" />
define(["require", "exports", "common/utilities/ArrayHelper", "common/utilities/ElementUtil", "ep/logic/search/ContentSearchAction", "utils/AngularUtil", "text!./search-box.html", "css!./search-box.css"], function (require, exports, ArrayHelper, ElementUtil, ContentSearchAction, AngularUtil) {
    var SearchBox = (function () {
        function SearchBox($scope, $timeout, $location, navigationService, dashboardUIManager, sessionManager) {
            this.$scope = $scope;
            this.externalReference = this;
            this.navigationService = navigationService;
            this.dashboardUIManager = dashboardUIManager;
            this.sessionManager = sessionManager;
            this.$timeout = $timeout;
            this.$locationService = $location;
        }
        SearchBox.directive = function () {
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
                link: function (scope, elem, attributes, controller) {
                    controller.onCreationComplete(elem);
                },
            };
        };
        Object.defineProperty(SearchBox.prototype, "searchText", {
            get: function () {
                return this.dashboardUIManager.searchText;
            },
            set: function (searchText) {
                this.dashboardUIManager.searchText = searchText;
            },
            enumerable: true,
            configurable: true
        });
        SearchBox.prototype.onCreationComplete = function (elem) {
            var _this = this;
            this.fields = ElementUtil.getTyped(["ep-search-box-input"], elem);
            $("#ep-search-box-button, .search-subject-option").on("mouseup touchend", function () { return _this.fields.epSearchBoxInput.focus(); });
            this.dashboardUIManager.forceOpenSearchBoxEvent.addEventListener(this.onForceOpen, this);
            this.$scope.$on("$destroy", function () { return _this.cleanUp(); });
        };
        SearchBox.prototype.cleanUp = function () {
            this.dashboardUIManager && this.dashboardUIManager.forceOpenSearchBoxEvent.removeEventListener(this.onForceOpen);
        };
        Object.defineProperty(SearchBox.prototype, "subjects", {
            get: function () {
                if (this.dashboardUIManager) {
                    if (this.dashboardUIManager.selectedClass.isExploreClass && this.dashboardUIManager.selectedClass.userSelectedSubject) {
                        return [this.dashboardUIManager.selectedClass.userSelectedSubject];
                    }
                    else {
                        return this.dashboardUIManager.recentSubjects;
                    }
                }
                return [];
            },
            enumerable: true,
            configurable: true
        });
        SearchBox.prototype.apply = function (action) {
            AngularUtil.safeApply(this.$scope, action);
        };
        SearchBox.prototype.onForceOpen = function (event) {
            var _this = this;
            if (this.dashboardUIManager.contentSearchResult && this.dashboardUIManager.contentSearchResult.SearchTermsUsed.trim() != "") {
                this.$timeout(function () {
                    if (_this.dashboardUIManager.contentSearchResult) {
                        _this.searchText = _this.dashboardUIManager.contentSearchResult.SearchTermsUsed;
                    }
                    _this.dashboardUIManager.searchBarOpen = true;
                });
            }
        };
        SearchBox.prototype.onMouseUpInBox = function (e) {
            e.stopPropagation();
        };
        SearchBox.prototype.onMouseUpElsewhere = function (e) {
            var _this = this;
            this.$timeout(function () {
                if (_this.dashboardUIManager.searchBarOpen && (_this.searchText === undefined || _this.searchText.trim() == "")) {
                    _this.dashboardUIManager.searchBarOpen = false;
                    $(".ep-search-box").off("mouseup touchend");
                    $(document).off("mouseup touchend");
                }
            }, 100);
        };
        SearchBox.prototype.submitSearch = function (e) {
            if (this.searchText === undefined || this.searchText.trim() == "") {
                this.dashboardUIManager.contentSearchResult = undefined;
                if (this.dashboardUIManager.selectedClass) {
                    this.navigationService.displayDashboardClassPage(this.dashboardUIManager.selectedClass.id);
                }
                return;
            }
            if (e.keyCode == 13) {
                if (this.subjects) {
                    this.getSearchResultFromServer(this.searchText);
                }
            }
        };
        SearchBox.prototype.onSearchButtonClick = function () {
            if (this.searchText === undefined || this.searchText.trim() == "") {
                this.dashboardUIManager.contentSearchResult = undefined;
                if (this.dashboardUIManager.selectedClass) {
                    this.navigationService.displayDashboardClassPage(this.dashboardUIManager.selectedClass.id);
                }
                return;
            }
            else {
                if (this.subjects) {
                    this.getSearchResultFromServer(this.searchText);
                }
            }
        };
        SearchBox.prototype.getSearchResultFromServer = function (searchText) {
            var targetSubjects = ArrayHelper.createArrayOfPropertiesFromItems(this.subjects, "ID");
            var request = {
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
        };
        SearchBox.prototype.onGetContentSearchResult = function (action) {
            if (action.successful) {
                this.dashboardUIManager.contentSearchResult = action.contentSearchResult;
                this.dashboardUIManager.title = "Search Results";
                this.navigationService.displayDashboardSearchResultPage(this.searchText);
                this.fields.epSearchBoxInput.blur();
            }
            else {
                console.log(action.faultMessage);
            }
        };
        SearchBox.prototype.startSearch = function () {
            var _this = this;
            this.$timeout(function () {
                $(".ep-search-box").on("mouseup touchend", _this.onMouseUpInBox.bind(_this));
                $(document).on("mouseup touchend", _this.onMouseUpElsewhere.bind(_this));
            });
        };
        SearchBox.prototype.showKeyboard = function () {
            this.fields.epSearchBoxInput.focus();
        };
        SearchBox.$inject = ["$scope",
            "$timeout",
            "$location",
            "navigationService",
            "dashboardUIManager",
            "sessionManager",
        ];
        return SearchBox;
    })();
    return SearchBox;
});
//# sourceMappingURL=SearchBox.js.map