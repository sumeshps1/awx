/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/
 export default
    ['$scope', '$rootScope', '$state', '$stateParams', 'SourcesListDefinition',
    'InventoryUpdate', 'GroupManageService', 'GroupsCancelUpdate',
    'ViewUpdateStatus', 'rbacUiControlService', 'GetBasePath',
    'GetSyncStatusMsg', 'GetHostsStatusMsg', 'Dataset', 'Find', 'QuerySet',
    'inventoryData', '$filter', 'Prompt', 'Wait', 'SourcesService',
    function($scope, $rootScope, $state, $stateParams, SourcesListDefinition,
        InventoryUpdate, GroupManageService, GroupsCancelUpdate,
        ViewUpdateStatus, rbacUiControlService, GetBasePath, GetSyncStatusMsg,
        GetHostsStatusMsg, Dataset, Find, qs, inventoryData, $filter, Prompt,
        Wait, SourcesService){

        let list = SourcesListDefinition;

        init();

        function init(){
        $scope.inventory_id = $stateParams.inventory_id;
        $scope.canAdhoc = inventoryData.summary_fields.user_capabilities.adhoc;
        $scope.canAdd = false;

        rbacUiControlService.canAdd(GetBasePath('inventory') + $scope.inventory_id + "/groups")
            .then(function(canAdd) {
                $scope.canAdd = canAdd;
            });

            // Search init
            $scope.list = list;
            $scope[`${list.iterator}_dataset`] = Dataset.data;
            $scope[list.name] = $scope[`${list.iterator}_dataset`].results;

            // The ncy breadcrumb directive will look at this attribute when attempting to bind to the correct scope.
            // In this case, we don't want to incidentally bind to this scope when editing a host or a group.  See:
            // https://github.com/ncuillery/angular-breadcrumb/issues/42 for a little more information on the
            // problem that this solves.
            $scope.ncyBreadcrumbIgnore = true;

            $scope.inventory_id = $stateParams.inventory_id;
            _.forEach($scope[list.name], buildStatusIndicators);

        }

        function buildStatusIndicators(inventory_source){
            if (inventory_source === undefined || inventory_source === null) {
                inventory_source = {};
            }

            let inventory_source_status, hosts_status;

            inventory_source_status = GetSyncStatusMsg({
                status: inventory_source.status,
                has_inventory_sources: inventory_source.has_inventory_sources,
                source: ( (inventory_source) ? inventory_source.source : null )
            });
            hosts_status = GetHostsStatusMsg({
                active_failures: inventory_source.hosts_with_active_failures,
                total_hosts: inventory_source.total_hosts,
                inventory_id: $scope.inventory_id,
                // group_id: group.id
            });
            _.assign(inventory_source,
                {status_class: inventory_source_status.class},
                {status_tooltip: inventory_source_status.tooltip},
                {launch_tooltip: inventory_source_status.launch_tip},
                {launch_class: inventory_source_status.launch_class},
                {group_schedule_tooltip: inventory_source_status.schedule_tip},
                {hosts_status_tip: hosts_status.tooltip},
                {hosts_status_class: hosts_status.class},
                {source: inventory_source ? inventory_source.source : null},
                {status: inventory_source ? inventory_source.status : null});
        }

        $scope.createSource = function(){
            $state.go('inventories.edit.inventory_sources.add');
        };
        $scope.editSource = function(id){
            $state.go('inventories.edit.inventory_sources.edit', {inventory_source_id: id});
        };
        $scope.deleteSource = function(inventory_source){
            var body = '<div class=\"Prompt-bodyQuery\">Are you sure you want to permanently delete the inventory source below from the inventory?</div><div class=\"Prompt-bodyTarget\">' + $filter('sanitize')(inventory_source.name) + '</div>';
            var action = function(){
                delete $rootScope.promptActionBtnClass;
                Wait('start');
                SourcesService.delete(inventory_source.id).then(() => {
                    $('#prompt-modal').modal('hide');
                    // if (parseInt($state.params.source_id) === id) {
                    //     $state.go("sources", null, {reload: true});
                    // } else {
                        $state.go($state.current.name, null, {reload: true});
                    // }
                    Wait('stop');
                });
            };
            // Prompt depends on having $rootScope.promptActionBtnClass available...
            Prompt({
                hdr: 'Delete Source',
                body: body,
                action: action,
                actionText: 'DELETE',
            });
            $rootScope.promptActionBtnClass = 'Modal-errorButton';
        };

        $scope.updateSource = function(inventory_source) {
            InventoryUpdate({
                scope: $scope,
                url: inventory_source.related.update
            });
        };

        $scope.cancelUpdate = function (id) {
            GroupsCancelUpdate({ scope: $scope, id: id });
        };
        $scope.viewUpdateStatus = function (id) {
            ViewUpdateStatus({
                scope: $scope,
                group_id: id
            });
        };
        $scope.scheduleSource = function(id) {
            // Add this group's id to the array of group id's so that it gets
            // added to the breadcrumb trail
            $state.go('inventories.edit.inventory_sources.edit.schedules', {inventory_source_id: id}, {reload: true});
        };

    }];
