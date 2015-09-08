/// <amd-dependency path="text!./score-board.html" />
/// <amd-dependency path="css!./score-board.css" />

import Action = require("common/actions/Action");
import ElementUtil = require("common/utilities/ElementUtil");
import UserCompetitionManager = require("ep/logic/competitions/UserCompetitionManager");
import CheerSingleStudentOnAction = require("ep/logic/messaging/CheerSingleStudentOnAction");
import SessionDataContainer = require("ep/logic/session/SessionDataContainer");
import SessionManager = require("ep/logic/session/SessionManager");
import DatasetSelectionTypes = require("ep/logic/statistics/classRankings/DatasetSelectionTypes");
import GlobalMonthScoreboardAction = require("ep/logic/statistics/classRankings/GlobalMonthScoreboardAction");
import GroupingSelectionTypes = require("ep/logic/statistics/classRankings/GroupingSelectionTypes");
import RankingDataDisplayObject = require("ep/logic/statistics/classRankings/RankingDataDisplayObject");
import RankingsOrganiser = require("ep/logic/statistics/classRankings/RankingsOrganiser");
import UserTaskManager = require("ep/logic/userTasks/UserTaskManager");
import AngularUtil = require("utils/AngularUtil");
import ClassDescription = services.Classes.BusinessObjects.ClassDescription;

class ScoreBoard
{
    public static directive(): ng.IDirective
    {
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
            // UNCOMMENT the following if you need to attach to HTML elements in the DOM
            //link: (scope: IScoreBoardScope, elem: JQuery, attributes: ng.IAttributes, controller: ScoreBoard) =>
            //{
            //    controller.onCreationComplete(elem);
            //},
        };
    }

    private externalReference: ScoreBoard;
    private $scope: ng.IScope;
    private sessionManager: SessionManager;
    private shown: boolean;
    private loading: boolean = true;
    private isfirstLoad: boolean = true;
    private monthDataSetID: number;
    private rankingsOrganiser: RankingsOrganiser;
    private userCompetitionManager: UserCompetitionManager;

    protected isFilteredBySubject: boolean = false;
    protected selectedScoreboard: string;
    protected availableClasses: ClassDescription[] = [];

    static $inject = [
        "$scope",
        "sessionManager",
        "rankingsOrganiser",
        "userCompetitionManager",
        "userTaskManager"
    ];
    constructor($scope: ng.IScope,
        sessionManager: SessionManager,
        rankingsOrganiser: RankingsOrganiser,
        userCompetitionManager: UserCompetitionManager,
        userTaskManager: UserTaskManager)
    {
        this.externalReference = this;
        this.$scope = $scope;
        this.sessionManager = sessionManager;
        this.userCompetitionManager = userCompetitionManager;
        this.rankingsOrganiser = rankingsOrganiser;

        if (this.sessionData)
        {
            if (userCompetitionManager.isCompetitionSelected)
            {
                this.rankingsOrganiser.changeDataSet(userCompetitionManager.selectedCompetition.DatasetID, DatasetSelectionTypes.COMPETITION);
            }
            else if (userTaskManager.aTaskIsSelected)
            {
                this.rankingsOrganiser.changeDataSet(userTaskManager.selectedTask.scoreDataSet, DatasetSelectionTypes.TASK);
            }

            this.rankingsOrganiser.rankingStatsUpdatedEvent.addEventListener(this.onChangeScoreboardSuccess, this);
            $scope.$on("$destroy", () => this.cleanUp());
            this.onChangeScoreboard(this.sessionData.settingsFacade.scoreboardGrouping);

            if (this.rankingsOrganiser.monthlyDataSetID === undefined)
            {
                var globalMonthScoreboard = new GlobalMonthScoreboardAction();
                globalMonthScoreboard.setCompletionFunction(this.onGetMonthScoreboardDataComplete, this);
                globalMonthScoreboard.execute();
            }
        }

    }

    private cleanUp()
    {
        this.rankingsOrganiser.rankingStatsUpdatedEvent.removeEventListener(this.onChangeScoreboardSuccess)
    }

    // UNCOMMENT the following if you need to attach to HTML elements in the DOM
    //private onCreationComplete(elem: JQuery)
    //{
    //    this.someElement = ElementUtil.get<HTMLElement>("some-element", elem);
    //}

    protected convertOrdinals(num: number): string
    {
        switch (num % 100)
        {
            case 11:
            case 12:
            case 13:
                return "th";
        }

        switch (num % 10)
        {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }

    protected addThousandSeparator(value: number): string
    {
        var regex: RegExp = /(\d+)(\d{3})/;
        return value.toString().replace(regex, '$1' + "," + '$2');
    }

    private get sessionData(): SessionDataContainer
    {
        return this.sessionManager.sessionData;
    }

    protected get selectedCompetitionCode(): string
    {
        if (this.userCompetitionManager && this.userCompetitionManager.selectedCompetition)
        {
            return this.userCompetitionManager.selectedCompetition.Code;
        }

        return "";
    }

    protected get scoreboardData(): RankingDataDisplayObject[]
    {
        return this.rankingsOrganiser.scoreboardData;
    }

    protected get userIDHash(): string
    {
        return this.sessionData ? this.sessionData.user.idHash : "";
    }

    protected get dataSetID(): number
    {
        return this.sessionData ? this.sessionData.defaultDataSetID : -1;
    }

    protected onCheerClick(student: RankingDataDisplayObject): void
    {
        if (student.userIDHash != null)
        {
            var cheerAction: Action = new CheerSingleStudentOnAction(this.sessionManager.sessionID, student.userIDHash, (remaining) => { this.onCheerSuccess(student, remaining); }, () => { this.onCheerFailure(student); });
            cheerAction.execute();
        }
    }

    private onCheerSuccess(item: RankingDataDisplayObject, remaining: number): void
    {
        var message: string = "Cheer sent! " + remaining + " left";
        this.animateCheerResult(item, message, true);
    }

    private onCheerFailure(item: RankingDataDisplayObject): void
    {
        var message: string = "No cheers left, Earn 10pts for more cheers!";
        this.animateCheerResult(item, message, false);
    }

    protected get isCompetitionSelected(): boolean
    {
        return this.selectedTimeframe == DatasetSelectionTypes.COMPETITION;
    }

    protected get selectedTimeframe(): DatasetSelectionTypes
    {
        return this.rankingsOrganiser.datasetSelectionType;
    }

    private animateCheerResult(item: RankingDataDisplayObject, message: string, success: boolean): void
    {
        var $cheerResultLabel: JQuery = $("#cheer-" + item.displayIndex);

        $cheerResultLabel.bind("animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd", (e) =>
        {
            $cheerResultLabel.removeClass("animating");
            $cheerResultLabel.html("");
            $cheerResultLabel.unbind(e);
        });

        var colour: string = success ? "#00B400" : "#AF0C00";

        $cheerResultLabel.css("color", colour);
        $cheerResultLabel.html(message);
        $cheerResultLabel.addClass("animating");
    }


    protected onTimeframeClick(timeframe: number)
    {
        if (timeframe == this.rankingsOrganiser.datasetSelectionType)
        {
            return;
        }

        switch (timeframe) 
        {
            case DatasetSelectionTypes.MONTH:
                this.rankingsOrganiser.disableProjectedScore();
                this.rankingsOrganiser.changeDataSet(this.monthDataSetID, timeframe);
                break;
            case DatasetSelectionTypes.COMPETITION:
            case DatasetSelectionTypes.YEAR:
            case DatasetSelectionTypes.TASK:
            default:
                this.rankingsOrganiser.changeDataSet(this.dataSetID, timeframe);
                break;
        }
    }

    protected onSubjectFilterClick(filter: boolean)
    {
        if (this.isFilteredBySubject == filter)
        {
            return;
        }

        this.isFilteredBySubject = filter;
        this.rankingsOrganiser.languageOnly(filter);
    }

    private onChangeScoreboardSuccess(grouping: number): void
    {
        AngularUtil.safeApply(this.$scope, () =>
        {
            this.loading = false;
        });
    }

    protected onChangeScoreboard(grouping: number): void
    {
        if (grouping == this.rankingsOrganiser.currentGrouping && !this.isfirstLoad)
        {
            return;
        }

        this.isfirstLoad = false;
        AngularUtil.safeApply(this.$scope, () =>
        {
            this.loading = true;
            switch (grouping)
            {
                case GroupingSelectionTypes.CLASS:
                    this.selectedScoreboard = "Class";
                    break;
                case GroupingSelectionTypes.SCHOOL:
                    this.selectedScoreboard = "School";
                    break;
                case GroupingSelectionTypes.COUNTRY:
                    this.selectedScoreboard = "Country";
                    break;
                case GroupingSelectionTypes.GLOBAL:
                    this.selectedScoreboard = "Global";
                    break;
            }
            this.rankingsOrganiser.changeScoreboardGrouping(grouping);
        });

    }

    private onGetMonthScoreboardDataComplete(action: GlobalMonthScoreboardAction)
    {
        if (action.successful)
        {
            this.rankingsOrganiser.monthlyDataSetID = action.monthDataSetID;
        }
    }
}

export = ScoreBoard;
