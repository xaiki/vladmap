var dict = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var SHEET_NAME = 'BASE BARRIOS BT';

Template.main.rendered = function () {
        var drop = document.getElementById('container');
        function handleDrop(e) {
                e.stopPropagation();
                e.preventDefault();

                showDropTarget();
                $('.drop i')[0].setAttribute('class', 'fa fa-refresh fa-spin huge');

                var files = e.dataTransfer.files;
                var i,f;
                for (i = 0, f = files[i]; i != files.length; ++i) {
                        var reader = new FileReader();
                        var name = f.name;
                        reader.onload = function(e) {
                                var data = e.target.result;
                                var wb;
                                try {
                                        var cfb = XLS.CFB.read(data, {type: 'binary'});
                                        //var arr = String.fromCharCode.apply(null, new Uint8Array(data));
                                        //var cfb = XLS.CFB.read(btoa(arr), {type: 'base64'});
                                        wb = XLS.parse_xlscfb(cfb);
                                } catch (e) {
                                        wb = XLSX.read(data, {type: 'binary'});
                                }
                                if (!wb) {
                                        error('Could not read: ' + name);
                                        return;
                                }
                                try {
                                        insertData(parseWB(wb));
                                } catch (err) {
                                        return error (err.message + err.stack);
                                }
                        };
                        reader.readAsBinaryString(f);
                        //reader.readAsArrayBuffer(f);
                }
        }

        function insertData(data) {
                Meteor.call ('reset', 'markers', data);

                //                setTimeout(location.reload, 1000);
                $('.drop i')[0].setAttribute('class', 'fa fa-check huge');
                console.log ("ok, go refresh");

        };
        function parseWB(wb) {
                var fsheet = wb.SheetNames.pop();
                var sheet = wb.Sheets[SHEET_NAME] || wb.Sheets[fsheet];
                var kmap = {};
                var data = [];

                if (!sheet)
                        return error ("Can't find sheet: " + SHEET_NAME + ' or ', fsheet);

                dict.forEach(function (k) {
                        var cell = sheet[k + '1'];
                        if (!cell)
                                return ; /* no cell at "${k}1" */
                        var value = cell.v;
                        if      (value.toUpperCase() === 'EMPRESA')
                                kmap.corp = k;
                        else if (value === 'Cantidad_Est_Usu_Afectados')
                                kmap.amplitude = k;
                        else if (value === 'Fecha_Reclamo')
                                kmap.date = k;
                        else if (value === 'Nro_Reclamo')
                                kmap.id = k;
                        else if (value === 'X')
                                kmap.lng = k;
                        else if (value === 'Y')
                                kmap.lat = k;
                        else
                                warn('ignoring: ' + value);
                });

                /* 1 is the title, ignore that */;

                for (var i = 2; sheet[kmap.corp + i]; i++) {
                        var value = {};
                        _.each(kmap, function (v, k) {
                                var cell = sheet[v + i];
                                if (!cell) {
                                        error('no data at' + v + i + 'bailing out, I will not parse that line');
                                        return;
                                }
                                value[k] = cell.v;
                        });

                        if  (Math.abs(value.lat) > 100 || Math.abs(value.lng) > 100) {
                                value.lat = Number(value.lat.toString().replace(/(-?..)/, '$1\.'));
                                value.lng = Number(value.lng.toString().replace(/(-?..)/, '$1\.'));
                                warn('lat/lng values out of bound for row: ' + i
                                     + ' fixing as lat: ' + value. lat + ' lng: ' + value.lng);

                        }

                        value.latlng = {lat: value.lat, lng: value.lng};
                        delete (value.lat);
                        delete (value.lng);

                        value.corp = value.corp.match(/(edesur|edenor)/i)[0].toLowerCase();

                        data.push(value);
                }
                return data;
        };

        function handleDragover(e) {
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                showDropTarget();
        }

        function showDropTarget() {
                $('.drop').show();
        };

        function hideDropTarget() {
                $('.drop').hide();
        };

        if(drop.addEventListener) {
                drop.addEventListener('dragenter', handleDragover, false);
                drop.addEventListener('dragover', handleDragover, false);
                drop.addEventListener('drop', handleDrop, false);

                drop.addEventListener('dragleave', hideDropTarget, false);
                drop.addEventListener('dragend', hideDropTarget, false);

        }
};
