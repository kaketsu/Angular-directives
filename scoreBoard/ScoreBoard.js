/// <amd-dependency path="text!./score-board.html" />
/// <amd-dependency path="css!./score-board.css" />
define(["require", "exports", "ep/logic/messaging/CheerSingleStudentOnAction", "ep/logic/statistics/classRankings/GlobalMonthScoreboardAction", "utils/AngularUtil", "text!./score-board.html", "css!./score-board.css"], function (require, exports, CheerSingleStudentOnAction, GlobalMonthScoreboardAction, AngularUtil) {
    var ScoreBoard = (function () {
        function ScoreBoard($scope, sessionManager, rankingsOrganiser, userCompetitionManager, userTaskManager) {
            var _this = this;
            this.loading = true;
            this.isfirstLoad = true;
            this.isFilteredBySubject = false;
            this.availableClasses = [];
            this.externalReference = this;
            this.$scope = $scope;
            this.sessionManager = sessionManager;
            this.userCompetitionManager = userCompetitionManager;
            this.rankingsOrganiser = rankingsOrganiser;
            if (this.sessionData) {
                if (userCompetitionManager.isCompetitionSelected) {
                    this.rankingsOrganiser.changeDataSet(userCompetitionManager.selectedCompetition.DatasetID, 4 /* COMPETITION */);
                }
                else if (userTaskManager.aTaskIsSelected) {
                    this.rankingsOrganiser.changeDataSet(userTaskManager.selectedTask.scoreDataSet, 3 /* TASK */);
                }
                this.rankingsOrganiser.rankingStatsUpdatedEvent.addEventListener(this.onChangeScoreboardSuccess, this);
                $scope.$on("$destroy", function () { return _this.cleanUp(); });
                this.onChangeScoreboard(this.sessionData.settingsFacade.scoreboardGrouping);
                if (this.rankingsOrganiser.monthlyDataSetID === undefined) {
                    var globalMonthScoreboard = new GlobalMonthScoreboardAction();
                    globalMonthScoreboard.setCompletionFunction(this.onGetMonthScoreboardDataComplete, this);
                    globalMonthScoreboard.execute();
                }
            }
        }
        ScoreBoard.directive = function () {
            return {
                scope: {
                    externalReference: "=?ref",
                    shown: "="
                },
                bindToController: true,
                controller: ScoreBoard,
                controllerAs: "self",
                replace: false,
                restrict: "E",
                template: require("text!./score-board.html"),
            };
        };
        ScoreBoard.prototype.cleanUp = function () {
            this.rankingsOrganiser.rankingStatsUpdatedEvent.removeEventListener(this.onChangeScoreboardSuccess);
        };
        // UNCOMMENT the following if you need to attach to HTML elements in the DOM
        //private onCreationComplete(elem: JQuery)
        //{
        //    this.someElement = ElementUtil.get<HTMLElement>("some-element", elem);
        //}
        ScoreBoard.prototype.convertOrdinals = function (num) {
            switch (num % 100) {
                case 11:
                case 12:
                case 13:
                    return "th";
            }
            switch (num % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };
        ScoreBoard.prototype.addThousandSeparator = function (value) {
            var regex = /(\d+)(\d{3})/;
            return value.toString().replace(regex, '$1' + "," + '$2');
        };
        Object.defineProperty(ScoreBoard.prototype, "sessionData", {
            get: function () {
                return this.sessionManager.sessionData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScoreBoard.prototype, "selectedCompetitionCode", {
            get: function () {
                if (this.userCompetitionManager && this.userCompetitionManager.selectedCompetition) {
                    return this.userCompetitionManager.selectedCompetition.Code;
                }
                return "";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScoreBoard.prototype, "scoreboardData", {
            get: function () {
                return this.rankingsOrganiser.scoreboardData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScoreBoard.prototype, "userIDHash", {
            get: function () {
                return this.sessionData ? this.sessionData.user.idHash : "";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScoreBoard.prototype, "dataSetID", {
            get: function () {
                return this.sessionData ? this.sessionData.defaultDataSetID : -1;
            },
            enumerable: true,
            configurable: true
        });
        ScoreBoard.prototype.onCheerClick = function (student) {
            var _this = this;
            if (student.userIDHash != null) {
                var cheerAction = new CheerSingleStudentOnAction(this.sessionManager.sessionID, student.userIDHash, function (remaining) { _this.onCheerSuccess(student, remaining); }, function () { _this.onCheerFailure(student); });
                cheerAction.execute();
            }
        };
        ScoreBoard.prototype.onCheerSuccess = function (item, remaining) {
            var message = "Cheer sent! " + remaining + " left";
            this.animateCheerResult(item, message, true);
        };
        ScoreBoard.prototype.onCheerFailure = function (item) {
            var message = "No cheers left, Earn 10pts for more cheers!";
            this.animateCheerResult(item, message, false);
        };
        Object.defineProperty(ScoreBoard.prototype, "isCompetitionSelected", {
            get: function () {
                return this.selectedTimeframe == 4 /* COMPETITION */;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScoreBoard.prototype, "selectedTimeframe", {
            get: function () {
                return this.rankingsOrganiser.datasetSelectionType;
            },
            enumerable: true,
            configurable: true
        });
        ScoreBoard.prototype.animateCheerResult = function (item, message, success) {
            var $cheerResultLabel = $("#cheer-" + item.displayIndex);
            $cheerResultLabel.bind("animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd", function (e) {
                $cheerResultLabel.removeClass("animating");
                $cheerResultLabel.html("");
                $cheerResultLabel.unbind(e);
            });
            var colour = success ? "#00B400" : "#AF0C00";
            $cheerResultLabel.css("color", colour);
            $cheerResultLabel.html(message);
            $cheerResultLabel.addClass("animating");
        };
        ScoreBoard.prototype.onTimeframeClick = function (timeframe) {
            if (timeframe == this.rankingsOrganiser.datasetSelectionType) {
                return;
            }
            switch (timeframe) {
                case 1 /* MONTH */:
                    this.rankingsOrganiser.disableProjectedScore();
                    this.rankingsOrganiser.changeDataSet(this.monthDataSetID, timeframe);
                    break;
                case 4 /* COMPETITION */:
                case 2 /* YEAR */:
                case 3 /* TASK */:
                default:
                    this.rankingsOrganiser.changeDataSet(this.dataSetID, timeframe);
                    break;
            }
        };
        ScoreBoard.prototype.onSubjectFilterClick = function (filter) {
            if (this.isFilteredBySubject == filter) {
                return;
            }
            this.isFilteredBySubject = filter;
            this.rankingsOrganiser.languageOnly(filter);
        };
        ScoreBoard.prototype.onChangeScoreboardSuccess = function (grouping) {
            var _this = this;
            AngularUtil.safeApply(this.$scope, function () {
                _this.loading = false;
            });
        };
        ScoreBoard.prototype.onChangeScoreboard = function (grouping) {
            var _this = this;
            if (grouping == this.rankingsOrganiser.currentGrouping && !this.isfirstLoad) {
                return;
            }
            this.isfirstLoad = false;
            AngularUtil.safeApply(this.$scope, function () {
                _this.loading = true;
                switch (grouping) {
                    case 1 /* CLASS */:
                        _this.selectedScoreboard = "Class";
                        break;
                    case 2 /* SCHOOL */:
                        _this.selectedScoreboard = "School";
                        break;
                    case 3 /* COUNTRY */:
                        _this.selectedScoreboard = "Country";
                        break;
                    case 4 /* GLOBAL */:
                        _this.selectedScoreboard = "Global";
                        break;
                }
                _this.rankingsOrganiser.changeScoreboardGrouping(grouping);
            });
        };
        ScoreBoard.prototype.onGetMonthScoreboardDataComplete = function (action) {
            if (action.successful) {
                this.rankingsOrganiser.monthlyDataSetID = action.monthDataSetID;
            }
        };
        ScoreBoard.$inject = [
            "$scope",
            "sessionManager",
            "rankingsOrganiser",
            "userCompetitionManager",
            "userTaskManager"
        ];
        return ScoreBoard;
    })();
    return ScoreBoard;
});
//# sourceMappingURL=ScoreBoard.js.map