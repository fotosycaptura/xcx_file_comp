var appTesting = angular.module("appTesting", ["ngFileUpload"]).config([
  "$interpolateProvider",
  function ($interpolateProvider) {
    $interpolateProvider.startSymbol("[[");
    $interpolateProvider.endSymbol("]]");
  },
]);

//Controller
appTesting.controller("appxTestingController", [
  "$scope",
  "$q",
  "$http",
  "appxTestingServices",
  "$timeout",
  "Upload",
  function ($scope, $q, $http, appxTestingServices, $timeout, Upload) {
    $scope.oVista = {
      ArchivoAnexo: null,
    };
    $scope.listado = [];
    $scope.duplicados = [];
    $scope.test = function () {
      alertify.warning("Hola Mundo");
    };
    $scope.CargarArchivos = function (files, Vista) {
      $scope.SelectedFiles = files;
      $scope.Progress = null;
      $scope.oVista.ArchivoAnexo = null;

      if ($scope.SelectedFiles && $scope.SelectedFiles.length) {
        Upload.upload({
          url: "/upload",
          data: {
            file: $scope.SelectedFiles,
          },
        })
          .then(
            function (response) {
              $timeout(function () {
                alertify.warning(response.data);
                $scope.RefrescarListado();
                $scope.Progress = null;
                $scope.oVista.ArchivoAnexo = null;
                document.getElementById("file").value = "";
                var element = angular.element(
                  document.querySelector("#dvProgress")
                );
                element.html(
                  '<div id="dvProgress" style="width: 0%"> 0%</div>'
                );
              });
            },
            function (response) {
              if (response.status > 0) {
                var errorMsg = response.status + ": " + response.data;
                $scope.SelectedFiles = null;
                var element = angular.element(
                  document.querySelector("#dvProgress")
                );
                element.html(
                  '<div id="dvProgress" style="width: 0%"> 0%</div>'
                );
                $scope.Progress = null;
                $scope.oVista.ArchivoAnexo = null;
                alertify.alert(
                  "Atención",
                  "No se pudo subir el archivo, el archivo es demasiado grande."
                );
                $scope.oVista.ArchivoAnexo = null;
                $scope.Progress = null;
              } else {
                alertify.alert(
                  "Atención",
                  "No se pudo subir el archivo. Se perdió conexión con el servidor."
                );
                $scope.oVista.ArchivoAnexo = null;
                $scope.Progress = null;
              }
            },
            function (evt) {
              var element = angular.element(
                document.querySelector("#dvProgress")
              );
              $scope.Progress = Math.min(
                100,
                parseInt((100.0 * evt.loaded) / evt.total)
              );
              element.html(
                '<div id="dvProgress" class="progress-bar" style="width: ' +
                  $scope.Progress +
                  '%">' +
                  $scope.Progress +
                  "%</div>"
              );
            }
          )
          .catch(function (e) {
            $scope.SelectedFiles = null;
            var element = angular.element(
              document.querySelector("#dvProgress")
            );
            element.html('<div id="dvProgress" style="width: 0%"> 0%</div>');
            $scope.Progress = null;
            $scope.oVista.ArchivoAnexo = null;
            alertify.alert(
              "Atención",
              "Se perdió la comunicación con el servidor. Por favor reinicie su sesión: " +
                e
            );
            $scope.oVista.ArchivoAnexo = null;
          });
        if ($scope.SelectedFiles != null && $scope.SelectedFiles.length) {
          $scope.oVista.ArchivoAnexo = $scope.SelectedFiles[0].name;
        }
      } else {
      } //if
    };
    function hasDuplicates(array) {
      var valuesSoFar = [];
      for (var i = 0; i < array.length; ++i) {
        var value = array[i][1];
        if (valuesSoFar.indexOf(value) !== -1) {
          $scope.duplicados = valuesSoFar;
          array[i][2] = true;
          return true;
        }
        valuesSoFar.push(value);
      }
      return false;
    }
    $scope.RefrescarListado = function () {
      appxTestingServices
        .getListado($q, $http)
        .then(function (data) {
          if (hasDuplicates(data)) {
            alertify.error(
              "Hay archivos con contenido idéntico.<br/>Por favor verifique los Hash."
            );
          }
          $scope.listado = data;
        })
        .catch(function () {
          alertify.error("Hubo un problema al intentar realizar la operación");
        });
    };
    $scope.RefrescarListado();

    $scope.eliminar = function (strNombre) {
      alertify.confirm(
        "Atención",
        "¿Está Ud. Seguro de realizar esta operación?",
        function () {
          appxTestingServices
            .deleteFile(strNombre, $q, $http)
            .then(function (data) {
              alertify.warning(data);
              $scope.RefrescarListado();
            })
            .catch(function () {
              alertify.error(
                "No se pudo establecer una comunicación con el servidor."
              );
            });
        },
        function () {
          alertify.warning("Se ha cancelado la operación");
        }
      );
    };
  },
]);
//Servicios
appTesting.factory("appxTestingServices", [
  function () {
    return {
      getListado: function ($q, $http) {
        var retorno;
        var def = $q.defer();
        var req = {
          method: "POST",
          url: "/listado",
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          data: JSON.stringify({}),
        };
        $http(req).then(
          function (response) {
            def.resolve(response.data);
          },
          function (response) {
            def.reject([]);
          }
        );
        return def.promise;
      },
      deleteFile: function (strNombre, $q, $http) {
        var retorno;
        var def = $q.defer();
        var req = {
          method: "POST",
          url: "/eliminar/" + strNombre,
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          data: JSON.stringify({}),
        };
        $http(req).then(
          function (response) {
            def.resolve(response.data);
          },
          function (response) {
            def.reject([]);
          }
        );
        return def.promise;
      },
    };
  },
]);
