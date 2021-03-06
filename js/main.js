/**
 * Angrarad Web client
 * Copyright 2014-2015 Nicolas Mora mail@babelouest.org
 * Licenced under AGPL
 */
var prefix = '';

var devicesTab = [];
var globalOverview = [];
var globalActions = [];
var globalScripts = [];
var globalSchedules = [];
var globalImages = [];
var globalAlerts = [];
var adminGlobal = false;
var userLang = navigator.language || navigator.userLanguage;
var globalMpd = [];
var globalMpdIntervalHandle = [];
var globalCurrentSong = [];
var globalRadioSongsList = [];
var globalRadioIntervalHandle = '';
var globalRadioToggle = false;
var globalRadioDataToggle = false;
var globalRadioSources = [];
var globalCurrentRadioStream = '';
var globalCameras = [];
var globalRestart = false;

function initConfig() {
  $.ajax({
      async: false,
      type: 'GET',
      url: 'config/config.json',
      success: function(data) {
          prefix = data.prefix;
      },
      fail: function() {
          $('#message-'+deviceId).text($.t('Error getting config'));
      }
  });
}

function htmlI18n() {
	$('html head').find('title').text($.t('Angharad Web Client'));
	$('#admin-edit-TEMPLATE').attr('value', $.t('Edit device'));
	$('#admin-reset-TEMPLATE').attr('value', $.t('Reset device'));
	$('#admin-script-add-TEMPLATE').attr('value', $.t('Add'));
	$('#admin-schedule-add-TEMPLATE').attr('value', $.t('Add'));
	$('#admin-script-global-add').attr('value', $.t('Add'));
	$('#admin-schedule-global-add').attr('value', $.t('Add'));
	$('#admin-action-global-add').attr('value', $.t('Add'));
	$('#dialog-script-action-add').attr('value', $.t('Add'));
	$('#refresh').attr('value', $.t('Refresh'));
	$('#dialog-script-action-up').attr('value', $.t('Up'));
	$('#dialog-script-action-down').attr('value', $.t('Down'));
	$('#dialog-script-action-remove').attr('value', $.t('Remove'));
	$('#restart-confirm').attr('value', $.t('Restart Angharad Server'));
	$('#restart-yes').attr('value', $.t('Yes, I know what I\'m doing'));
	$('#restart-no').attr('value', $.t('No, I will think again'));
	$('.template').i18n();
}

$(document).ready(function() {

  $.i18n.init({fallbackLng:'en'}).done(function() {
    htmlI18n();
    $.contextMenu({
      selector: '.admin-modify-delete',
      trigger: 'left',
      callback: function (key, options) {
        if (key == 'edit') {
          if ($(this).attr('name').indexOf('admin-global-action') == 0) {
            editAction($(this));
          } else if ($(this).attr('name').indexOf('admin-global-script') == 0 || $(this).attr('name').indexOf('admin-script') == 0) {
            editScript($(this));
          } else if ($(this).attr('name').indexOf('admin-global-schedule') == 0 || $(this).attr('name').indexOf('admin-schedule') == 0) {
            editSchedule($(this));
          }
        } else {
          if ($(this).attr('name').indexOf('admin-global-action') == 0) {
            deleteAction($(this));
          } else if ($(this).attr('name').indexOf('admin-global-script') == 0 || $(this).attr('name').indexOf('admin-script') == 0) {
            deleteScript($(this));
          } else if ($(this).attr('name').indexOf('admin-global-schedule') == 0 || $(this).attr('name').indexOf('admin-schedule') == 0) {
            deleteSchedule($(this));
          }
        }
      },
      items: {
        'edit': {name: $.t('Edit'), icon: 'edit'},
        'delete': {name: $.t('Delete'), icon: 'delete'},
      }
    });
      
    $.contextMenu({
      selector: '.admin-modify-graph',
      trigger: 'left',
      callback: function (key, options) {
        if (key == 'graph') {
          if ($(this).attr('name').indexOf('admin-sensor-') == 0) {
            monitorElement($(this));
          } else if ($(this).attr('name').indexOf('admin-switch-') == 0) {
            monitorElement($(this));
          } else if ($(this).attr('name').indexOf('admin-dimmer-') == 0) {
            monitorElement($(this));
          } else if ($(this).attr('name').indexOf('admin-heater-') == 0) {
            monitorElement($(this));
          }
        } else {
          if ($(this).attr('name').indexOf('admin-sensor-') == 0) {
            editSensor($(this));
          } else if ($(this).attr('name').indexOf('admin-switch-') == 0) {
            editSwitch($(this));
          } else if ($(this).attr('name').indexOf('admin-dimmer-') == 0) {
            editDimmer($(this));
          } else if ($(this).attr('name').indexOf('admin-heater-') == 0) {
            editHeater($(this));
          }
        }
      },
      items: {
        'edit': {name: $.t('Edit'), icon: 'edit'},
        'graph': {name: $.t('Graph'), icon: 'graph'},
      }
    });
  
    $.contextMenu({
      selector: '.admin-modify',
      trigger: 'left',
      callback: function (key, options) {
        if ($(this).attr('name').indexOf('admin-sensor-') == 0) {
          editSensor($(this));
        } else if ($(this).attr('name').indexOf('admin-switch-') == 0) {
          editSwitch($(this));
        } else if ($(this).attr('name').indexOf('admin-dimmer-') == 0) {
          editDimmer($(this));
        } else if ($(this).attr('name').indexOf('admin-heater-') == 0) {
          editHeater($(this));
        }
      },
      items: {
        'edit': {name: $.t('Edit'), icon: 'edit'},
      }
    });
  });

	initConfig();
	
	initDevices();
	
});

function initDevices() {
	// Language selection
	
	var url = prefix+'/DEVICES/';
	$('#message').text($.t('Loading'));
	$('#tabs ul').empty();
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if ($.isArray(json.devices)) {
			//devicesTab = json.devices;
			for (var i=0; i<json.devices.length; i++) {
				var device = json.devices[i];
				devicesTab[device.name] = device;
				devicesTab[device.name].admin = false;
				$('#tabs ul').append('<li><a href="#tab-'+device.name+'" id="href-'+device.name+'">'+device.display+'</a></li>\n');
				var template = $('#template-device').html().replace('tab-TEMPLATE', 'tab-'+device.name).replace(/TEMPLATE/g, device.name);
				$('#tabs').append(template);
				$('#tab-'+device.name).hide();
				$('#href-'+device.name).click(function(){
					$('#tabs ul li').removeClass('active');
					$(this).parent().addClass('active');
					var currentTab = $(this).attr('href'); 
					$('#tabs .tab').hide();
					$(currentTab).show();
					return false;
				});
				overviewDevice(device.name);
			}
			$('#tabs ul').append('<li><a href="#tab-cameras" id="href-cameras">'+$.t('Cameras')+'</a></li>');
			var template = $('#template-cameras').html();
			$('#tabs').append(template);
			$('#href-cameras').click(function(){
				$('#tabs ul li').removeClass('active');
				$(this).parent().addClass('active'); 
				var currentTab = $(this).attr('href'); 
				$('#tabs .tab').hide();
				$(currentTab).show();
				return false;
			});
			
			$('#tabs ul').append('<li><a href="#tab-global" id="href-global">'+$.t('Global')+'</a></li>');
			var template = $('#template-global').html();
			$('#tabs').append(template);
			$('#href-global').click(function(){
				$('#tabs ul li').removeClass('active');
				$(this).parent().addClass('active'); 
				var currentTab = $(this).attr('href'); 
				$('#tabs .tab').hide();
				$(currentTab).show();
				return false;
			});
			$('#a-admin-global').click(function() {
				adminGlobal = !adminGlobal;
				$('#tab-global .admin-button').slideToggle();
				$('#tab-global .p-hidden').slideToggle();
				return false;
			});
			
			$('#refresh').click(function () {
				refresh(true);
			});
			
			$('#global-lang-select option[value="'+$.i18n.options.lng+'"]').prop('selected', true);
			
			$('#global-lang-select').change(function() {
				window.location = window.location.pathname + '?setLng=' + $(this).val();
			});

			$('#tabs .tab').hide();
			$('#tabs div:first').show();
			$('#tabs ul li:first').addClass('active');
			
			initActions();
			
			initScripts();
			
			initSchedules();

			toggleRadio(globalRadioToggle);
			toggleRadioData(globalRadioDataToggle);
      
      toggleRestart();

			$('#radio-toggle').click(function() {
				toggleRadio(!globalRadioToggle);
			});
			
			$('#radio-data-toggle').click(function() {
				toggleRadioData(!globalRadioDataToggle);
			});
			
			$('#radio-list').change(function() {
				changeRadioSource($(this).val());
			});
      
      $('#restart-confirm').click(function() {
        toggleRestart();
      });
      
      $('#restart-no').click(function() {
        toggleRestart();
      });
      
      $('#restart-yes').click(function() {
        restartServer();
      });

			$('#message').text('');
			
			var date = new Date();
			$('#footer-message').text($.t('Last sync')+': '+date.toLocaleString());

		} else {
			$('#message').text($.t('Error loading devices'));
		}
		setInterval(function() {
			refresh(false);
		}, 1000*60*5);
		initCameras();
		
	})
	.fail(function() {
		$('#message').text($.t('Error loading devices')+', '+$.t('network error'));
	});
}

function overviewDevice(deviceId) {
	var url = prefix+'/OVERVIEW/'+deviceId;
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if (!json.syntax_error) {
			globalOverview[deviceId] = json.device;
		var switches_list = json.device.switches;
			var $switches = $('#switch-'+deviceId+' .inside');
		if (switches_list.length == 0) {
			$('#switch-'+deviceId).hide();
		}
		for (var i=0; i<switches_list.length; i++) {
			var switcher = switches_list[i];
			var isChecked = switcher.status==1?'checked="checked"':'';
			var switcherClass = '';
			if (switcher.type == 0) {
				// Normally on
				switcherClass = 'sw-type-no';
			} else if (switcher.type == 1) {
				// Normally on
				switcherClass = 'sw-type-nc';
			} else if (switcher.type == 2) {
				// Three-way
				switcherClass = 'sw-type-tw';
			}
			var htmlSwitcher = '<p id="p-switch-'+deviceId+'-'+switcher.name+'" class="'+(!switcher.enabled?'p-hidden':'')+' '+switcherClass+'"><input type="button" class="admin-button admin-modify-graph" value="+" name="admin-switch-'+deviceId+'-'+switcher.name+'" id="admin-switch-'+deviceId+'-'+switcher.name+'" data-an-device="'+deviceId+'" data-an-switch="'+switcher.name+'" data-an-unit=""/><input type="checkbox" value="sw-'+deviceId+'-'+switcher.name+'" data-an-device="'+deviceId+'" data-an-switcher="'+switcher.name+'" name="sw-'+deviceId+'-'+switcher.name+'" id="sw-'+deviceId+'-'+switcher.name+'" '+isChecked+' data-an-display="'+switcher.enabled+'"/>';
			htmlSwitcher += '<label for="sw-'+deviceId+'-'+switcher.name+'" id="label-sw-'+deviceId+'-'+switcher.name+'" >'+switcher.display+'</label>';
			htmlSwitcher += '<label id="message-'+deviceId+'-'+switcher.name+'"></label></p>\n';
			$switches.append(htmlSwitcher);
			var $checkbox = $('#sw-'+deviceId+'-'+switcher.name);
			$checkbox.change(function() {
				var value = $(this).prop('checked')?'1':'0';
				setSwitchValue($(this).attr('data-an-device'), $(this).attr('data-an-switcher'), value);
			});
		}
		
		var $sensor = $('#sensor-'+deviceId+' .inside');
      var sensors_list = json.device.sensors;
      if (sensors_list.length == 0) {
        $('#sensor-'+deviceId).hide();
      }
			for (var i=0; i<sensors_list.length; i++) {
				var sensor = sensors_list[i];
				var htmlSensor = '<p id="p-sensor-'+deviceId+'-'+sensor.name+'" class="sensor '+(!sensor.enabled?'p-hidden':'')+'"><input type="button" class="admin-button admin-modify-graph" value="+" name="admin-sensor-'+deviceId+'-'+sensor.name+'" id="admin-sensor-'+deviceId+'-'+sensor.name+'" data-an-device="'+deviceId+'" data-an-sensor="'+sensor.name+'" data-an-unit="'+sensor.unit+'"/><label id="label-'+deviceId+'-'+sensor.name+'" for="'+deviceId+'-'+sensor.name+'">'+sensor.display+': </label>';
				htmlSensor += '<label id="value-'+deviceId+'-'+sensor.name+'" value="'+sensor.value+'" data-sensor-unit="'+sensor.unit+'">'+sensor.value+' '+sensor.unit+'</label></p>\n';
				$sensor.append($(htmlSensor));
				if (!sensor.enabled) {
					$('#p-sensor'+deviceId+'-'+sensor.name).hide();
				}
				$('#value-'+deviceId+'-'+sensor.name).click(function() {
					var curIdSplit = $(this).attr('id').split('-');
					var $fakeButton = $('<input type="button" data-an-device="'+curIdSplit[1]+'" data-an-sensor="'+curIdSplit[2]+'" data-an-unit="'+$(this).attr('data-sensor-unit')+'"/>');
					monitorElement($fakeButton);
				});
			}
			
			var $heater = $('#heater-'+deviceId+' .inside');
      var heaters_list = json.device.heaters;
      if (heaters_list.length == 0) {
        $('#heater-'+deviceId).hide();
      }
			for (var i=0; i<heaters_list.length; i++) {
				var heater = heaters_list[i];
				var isSet = heater.set?'checked="checked"':'';
				var htmlHeater = '<p id="p-heater-'+deviceId+'-'+heater.name+'" class="'+(!heater.enabled?'p-hidden':'')+'"><input type="button" class="admin-button admin-modify-graph" value="+" name="admin-heater-'+deviceId+'-'+heater.name+'" id="admin-heater-'+deviceId+'-'+heater.name+'" data-an-device="'+deviceId+'" data-an-heater="'+heater.name+'" data-an-unit="'+heater.unit+'"/>\n'
				htmlHeater += '<input type="checkbox" value="he-'+deviceId+'-'+heater.name+'" data-an-device="'+deviceId+'" data-an-heater="'+heater.name+'" name="he-'+deviceId+'-'+heater.name+'" id="he-'+deviceId+'-'+heater.name+'" '+isSet+' /><label id="label-heater-'+deviceId+'-'+heater.name+'" for="he-'+deviceId+'-'+heater.name+'" data-an-label="'+heater.display+'">'+heater.display+'</label>';
				htmlHeater += '<div id="label-he-slide-'+deviceId+'-'+heater.name+'"></div><div class="heater" data-an-device="'+deviceId+'" data-an-heater="'+heater.name+'" id="he-slide-'+deviceId+'-'+heater.name+'" ></div>\n';
				htmlHeater += '</p>\n';
				$heater.append(htmlHeater);
				$('#label-he-slide-'+deviceId+'-'+heater.name).html(heater.max_value+' '+heater.unit);
				$(function() {
					$('#he-slide-'+deviceId+'-'+heater.name).empty().slider({
						min:0,
						max:50,
						step:0.2,
						value:heater.max_value,
						disabled:!heater.set,
						heater:heater.name,
						slide:function( event, ui ) {
							$('#label-he-slide-'+$(this).attr('data-an-device')+'-'+$(this).attr('data-an-heater')).html(ui.value+' '+heater.unit);
						},
						change:function( event, ui ) {
							if (event.originalEvent) {
								var heaterId = $(this).attr('data-an-heater');
								var deviceId = $(this).attr('data-an-device');
								var url = prefix+'/SETHEATER/'+deviceId+'/'+heaterId+'/1/'+$(this).slider( 'value' );
								var jqxhr = $.get( url, function(data) {
									//var json = $.parseJSON(data);
								})
								.fail(function() {
									var $label = $('#label-heater-'+deviceId+'-'+heaterId);
									$label.text($label.attr('data-an-label') + ' - ' + $.t('Error setting heater'));
									setTimeout(function() {
										$label.text($label.attr('data-an-label'));
										//$(this).slider('option', 'disabled', false);
									}, 10000);
								});
							}
						}
					});
				});
				$('#he-'+deviceId+'-'+heater.name).change(function() {
					var $check = $('#he-'+deviceId+'-'+$(this).attr('data-an-heater'));
					var heaterId = $(this).attr('data-an-heater');
					var deviceId = $(this).attr('data-an-device');
					var isChecked = $(this).prop('checked');
					var $check = $(this);
					var url = prefix+'/SETHEATER/'+deviceId+'/'+heaterId+'/'+(isChecked?'1':'0')+'/'+$('#he-slide-'+deviceId+'-'+heaterId).slider( 'value' );
					var jqxhr = $.get( url, function(data) {
						//var json = $.parseJSON(data);
					})
					.fail(function() {
						var $label = $('#label-heater-'+deviceId+'-'+heaterId);
						$label.text($label.attr('data-an-label') + ' - ' + $.t('Error setting heater'));
						$check.prop('checked', !isChecked);
						$check.prop('disabled', true);
						$('#he-slide-'+deviceId+'-'+$check.attr('data-an-heater')).slider('option', 'disabled', true);
						setTimeout(function() {
							$label.text($label.attr('data-an-label'));
							$check.prop('disabled', false);
							$('#he-slide-'+deviceId+'-'+$check.attr('data-an-heater')).slider('option', 'disabled', isChecked);
						}, 10000);
					});
					$('#he-slide-'+deviceId+'-'+$(this).attr('data-an-heater')).slider('option', 'disabled', !$(this).prop('checked'));
				});
				if (!heater.enabled) {
					$('#label-he-slide-'+deviceId+'-'+heater.name).hide();
					$('#he-slide-'+deviceId+'-'+heater.name).hide();
				}
			}

			
      var dimmers_list = json.device.dimmers;
			var $dimmer = $('#dimmer-'+deviceId+' .inside');
			if (dimmers_list.length == 0) {
				$('#dimmer-'+deviceId).hide();
			}
			for (var i=0; i<dimmers_list.length; i++) {
				var dimmer = dimmers_list[i];
				var htmlDimmer = '<p id="p-dimmer-'+deviceId+'-'+dimmer.name+'" class="'+(!dimmer.enabled?'p-hidden':'')+'"><input type="button" class="admin-button admin-modify-graph" value="+" name="admin-dimmer-'+deviceId+'-'+dimmer.name+'" id="admin-dimmer-'+deviceId+'-'+dimmer.name+'" data-an-device="'+deviceId+'" data-an-dimmer="'+dimmer.name+'" data-an-unit="&#37;"/>\n'
			  htmlDimmer += '<label id="label-dimmer-'+deviceId+'-'+dimmer.name+'" for="di-'+deviceId+'-'+dimmer.name+'" data-an-label="'+dimmer.display+'">'+dimmer.display+'</label>\n';
				htmlDimmer += '<div class="dimmer-row">\n';
				htmlDimmer += '<div class="dimmer-0"><input type="button" name="di-set-0-'+deviceId+'-'+dimmer.name+'" id="di-set-0-'+deviceId+'-'+dimmer.name+'" value="0%" data-an-dimmer-value="0" class="styled-button" data-an-dimmer="di-slide-'+deviceId+'-'+dimmer.name+'" data-an-dimmer-id="'+dimmer.name+'"></div>\n';
				htmlDimmer += '<div class="dimmer-25"><input type="button" name="di-set-25-'+deviceId+'-'+dimmer.name+'" id="di-set-25-'+deviceId+'-'+dimmer.name+'" value="25%" data-an-dimmer-value="25" class="styled-button" data-an-dimmer="di-slide-'+deviceId+'-'+dimmer.name+'" data-an-dimmer-id="'+dimmer.name+'"></div>\n';
				htmlDimmer += '<div class="dimmer-50"><input type="button" name="di-set-50-'+deviceId+'-'+dimmer.name+'" id="di-set-50-'+deviceId+'-'+dimmer.name+'" value="50%" data-an-dimmer-value="50" class="styled-button" data-an-dimmer="di-slide-'+deviceId+'-'+dimmer.name+'" data-an-dimmer-id="'+dimmer.name+'"></div>\n';
				htmlDimmer += '<div class="dimmer-75"><input type="button" name="di-set-75-'+deviceId+'-'+dimmer.name+'" id="di-set-75-'+deviceId+'-'+dimmer.name+'" value="75%" data-an-dimmer-value="75" class="styled-button" data-an-dimmer="di-slide-'+deviceId+'-'+dimmer.name+'" data-an-dimmer-id="'+dimmer.name+'"></div>\n';
				htmlDimmer += '<div class="dimmer-100"><input type="button" name="di-set-100-'+deviceId+'-'+dimmer.name+'" id="di-set-100-'+deviceId+'-'+dimmer.name+'" value="100%" data-an-dimmer-value="100" class="styled-button" data-an-dimmer="di-slide-'+deviceId+'-'+dimmer.name+'" data-an-dimmer-id="'+dimmer.name+'"></div>\n';
				htmlDimmer += '</div>\n';
				htmlDimmer += '<div id="label-di-slide-'+deviceId+'-'+dimmer.name+'"></div><div class="dimmer" data-an-device="'+deviceId+'" data-an-dimmer="'+dimmer.name+'" id="di-slide-'+deviceId+'-'+dimmer.name+'" ></div>\n';
				htmlDimmer += '</p>\n';
				$dimmer.append(htmlDimmer);
				$('#label-di-slide-'+deviceId+'-'+dimmer.name).html(dimmer.value+' %');
				$(function() {
					$('#di-slide-'+deviceId+'-'+dimmer.name).slider({
						min:0,
						max:99,
						step:1,
						value:dimmer.value,
						slide:function( event, ui ) {
							$('#label-di-slide-'+$(this).attr('data-an-device')+'-'+$(this).attr('data-an-dimmer')).html(ui.value+' %');
						},
						change:function( event, ui ) {
							if (event == null || event.originalEvent) {
								var dimmerId = $(this).attr('data-an-dimmer');
								var deviceId = $(this).attr('data-an-device');
								var url = prefix+'/SETDIMMER/'+deviceId+'/'+dimmerId+'/'+$(this).slider( 'value' );
								var jqxhr = $.get( url, function(data) {
									//var json = $.parseJSON(data);
								})
								.fail(function() {
									var $label = $('#label-dimmer-'+deviceId+'-'+dimmerId);
									$label.text($label.attr('data-an-label') + ' - ' + $.t('Error setting dimmer'));
									setTimeout(function() {
										$label.text($label.attr('data-an-label'));
									}, 10000);
								});
							}
						}
					});
				});
			}
			$('#dimmer-'+deviceId).find('.dimmer-row input').click(function() {
				var dimmerId = $(this).attr('data-an-dimmer')
				var $dimmer = $('#'+dimmerId);
				var value = $(this).attr('data-an-dimmer-value');
				var dimmerName = $(this).attr('data-an-dimmer-id');
				var url = prefix+'/SETDIMMER/'+deviceId+'/'+dimmerName+'/'+value;
				var jqxhr = $.get( url, function(data) {
					$dimmer.slider('value', value);
					$('#label-'+dimmerId).html(value+' %');
				})
				.fail(function() {
					var $label = $('#label-'+dimmerId);
					$label.text($label.attr('data-an-label') + ' - ' + $.t('Error setting dimmer'));
					setTimeout(function() {
						$label.text($label.attr('data-an-label'));
					}, 10000);
				});
			});
      
	  }
    
		initMusic(deviceId);

	})
	.fail(function() {
		$('#message-'+deviceId).text($.t('Error getting device values'));
	});
	
	$('#a-admin-'+deviceId).click(function() {
		devicesTab[deviceId].admin = !devicesTab[deviceId].admin;
		$('#tab-'+deviceId+' .admin-button').slideToggle();
		$('#tab-'+deviceId+' .p-hidden').slideToggle();
		return false;
	});
	
	$('#admin-edit-'+deviceId).click(function() {
		for (key in devicesTab) {
			if (devicesTab[key].name == $(this).attr('data-an-device')) {
				editDevice(devicesTab[key]);
			}
		}
		return false;
	});
	
	$('#admin-reset-'+deviceId).click(function() {
		for (key in devicesTab) {
			if (devicesTab[key].name == $(this).attr('data-an-device')) {
				resetDevice(devicesTab[key]);
			}
		}
		return false;
	});
}

function resetDevice(device) {
	var $message = $('#header-message-'+device.name);
	$message.text($.t('Reset device'));
	var url = prefix + '/RESET/' + device.name;
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if (json.result.response == 1 || json.result.response == 0) {
			$message.text('');
		} else {
			$message.text($.t('Error reset device'));
		}
	})
	.fail(function() {
		$message.text($.t('Error reset device')+', '+$.t('network error'));
	})
}

function setSwitchValue(device, switcher, value) {
	var $message = $('#message-'+device+'-SWITCH'+switcher);
	var $switch = $('#sw-'+device+'-SWITCH'+switcher);
	$message.text('...');
	var url = prefix+'/SETSWITCH/'+device+'/'+switcher+'/'+value;
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if (json.result.response == 1 || json.result.response == 0) {
			$message.text('');
		} else {
			$message.text(' '+$.t('Error setting switch'));
			$switch.prop('checked', !$switch.prop('checked'));
			$switch.prop('disabled', true);
			setTimeout(function() {
				$message.text('');
				$switch.prop('disabled', false);
			}, 10000);
		}
	})
	.fail(function() {
		$message.text(' '+$.t('Error setting switch')+', '+$.t('network error'));
		$switch.prop('checked', !$switch.prop('checked'));
		$switch.prop('disabled', true);
		setTimeout(function() {
			$message.text('');
			$switch.prop('disabled', false);
		}, 10000);
	})
}

function initScripts() {
	var urlScripts = prefix+'/SCRIPTS/';
	var jqxhr = $.get( urlScripts, function(dataScripts) {
		var jsonScripts = $.parseJSON(dataScripts);
		for (var i=0; i<jsonScripts.scripts.length; i++) {
			var script = jsonScripts.scripts[i];
			globalScripts[script.id] = script;
			var enabled = script.enabled?'enabled="true"':'enabled="false"';
			var htmlScript = '<p><input type="button" id="admin-global-script-'+script.id+'" name="admin-global-script-'+script.id+'" data-an-script-id="'+script.id+'" class="admin-button admin-modify-delete" value="+"><input type="button" data-an-script-id="'+script.id+'" data-an-device="" name="script-'+script.id+'" id="script-'+script.id+'" value="'+script.name+'" '+enabled+' class="styled-button"><label id="message-script-'+script.id+'"></label></p>\n';
			$('#script-global .inside').append(htmlScript);
			$('#script-'+script.id).click(function() {
				runScript(this);
			});
			
			if (script.device != "") {
				htmlScript = '<p><input type="button" id="admin-script-'+script.id+'" name="admin-script-'+script.id+'" data-an-script-id="'+script.id+'" class="admin-button admin-modify-delete" value="+"><input type="button" data-an-script-id="'+script.id+'" data-an-device="'+script.device+'" name="script-'+script.device+'-'+script.id+'" id="script-'+script.device+'-'+script.id+'" value="'+script.name+'" '+enabled+' class="styled-button"/><label id="message-script-'+script.device+'-'+script.id+'"></label></p>\n';
				$('#script-'+script.device+' .inside').append(htmlScript);
				$('#script-'+script.device+'-'+script.id).click(function() {
					runScript(this);
				});
			}
		}
		$('.admin-script-add').click(function() {
			editScript(null);
		});
	})
	.fail(function() {
		$message.text($.t('Error getting tasks'));
	})
	
}

function runScript(scriptButton) {
	var scriptId = $(scriptButton).attr('data-an-script-id');
	var $message = $('#message-script-'+scriptId);
	if ($(scriptButton).attr('data-an-device') != "") {
		$message = $('#message-script-'+$(scriptButton).attr('data-an-device')+'-'+scriptId);
	}
	$message.text(' '+$.t('Running')+'...');
	var url = prefix+'/RUNSCRIPT/'+scriptId;
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if (json.result == 'ok') {
			$message.text('');
		} else {
			$message.text(' '+$.t('Error running task'));
			setTimeout(function() {
				$message.text('');
			}, 10000);
		}
		refresh(false);
	})
	.fail(function() {
		$message.text(' '+$.t('Error running task')+', '+$.t('network error'));
		setTimeout(function() {
			$message.text('');
		}, 10000);
	})
}

function initSchedules() {
	var urlSchedules = prefix+'/SCHEDULES/';
	var jqxhr = $.get( urlSchedules, function(dataSchedule) {
		var jsonSchedule = $.parseJSON(dataSchedule);
		for (var i=0; i<jsonSchedule.schedules.length; i++) {
			var schedule = jsonSchedule.schedules[i];
			globalSchedules[schedule.id] = schedule;
			var nextTime = new Date(schedule.next_time * 1000);
			var enabled = schedule.enabled;
			var htmlSchedule = '<p id="p-schedule-'+schedule.id+'" class="class-schedule class-schedule-'+schedule.id+'"><input type="button" data-an-schedule-id="'+schedule.id+'" class="admin-button admin-modify-delete" value="+" name="admin-schedule-'+schedule.id+'" id="admin-schedule-'+schedule.id+'"/><input type="checkbox" value="schedule-'+schedule.id+'" data-an-schedule="'+schedule.id+'" data-an-device="" name="schedule-'+schedule.id+'" id="schedule-'+schedule.id+'" /><label for="schedule-'+schedule.id+'" id="message-schedule-'+schedule.id+'"></label></p>\n';
			$('#schedule-global .inside').append(htmlSchedule);
			if (!enabled) {
				$('#message-schedule-'+schedule.id).text(schedule.name+' ('+$.t('Disabled')+')');
				$('#schedule-'+schedule.id).prop('checked', false);
			} else {
				$('#message-schedule-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
				$('#schedule-'+schedule.id).prop('checked', true);
			}
			$('#schedule-'+schedule.id).change(function() {
				var value = $(this).prop('checked')?'1':'0';
				enableSchedule($(this), value);
			});
			if (schedule.device != "") {
				var htmlSchedule = '<p id="p-schedule-'+schedule.device+'-'+schedule.id+'" class="class-schedule class-schedule-'+schedule.id+'"><input type="button" data-an-schedule-id="'+schedule.id+'" class="admin-button admin-modify-delete" value="+" name="admin-schedule-'+schedule.device+'-'+schedule.id+'" id="admin-schedule-'+schedule.device+'-'+schedule.id+'"/><input type="checkbox" value="schedule-'+schedule.device+'-'+schedule.id+'" data-an-schedule="'+schedule.id+'" data-an-device="'+schedule.device+'" name="schedule-'+schedule.device+'-'+schedule.id+'" id="schedule-'+schedule.device+'-'+schedule.id+'" /><label for="schedule-'+schedule.device+'-'+schedule.id+'" id="message-schedule-'+schedule.device+'-'+schedule.id+'"></label></p>\n';
				$('#schedule-'+schedule.device+' .inside').append(htmlSchedule);
				if (!enabled) {
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+' ('+$.t('Disabled')+')');
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', false);
				} else {
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', true);
				}
				$('#schedule-'+schedule.device+'-'+schedule.id).change(function() {
					var value = $(this).prop('checked')?'1':'0';
					enableSchedule($(this), value);
				});
			}
		}
    $('.admin-schedule-add').remove('click').click(function() {
      editSchedule(null);
    });
		$('#admin-schedule-global-add').remove('click').click(function() {
			editSchedule(null);
		});
	})
	.fail(function() {
		$('#message-global').text($.t('Error getting schedules'));
	})
}

function enableSchedule($schedule, value) {
	var scheduleId = $schedule.attr('data-an-schedule');
	var $message = $('#message-schedule-'+scheduleId);
	var curMessage = $message.text();
	var isChecked = $schedule.prop('checked');
	if ($schedule.attr('data-an-device') != "") {
		$message = $('#message-schedule-'+$schedule.attr('data-an-device')+'-'+scheduleId);
	}
	var url = prefix+'/ENABLESCHEDULE/'+scheduleId+'/'+value;
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		if (json.result != 'error') {
			if (!json.schedule.enabled) {
				$message.text(json.schedule.name+' ('+$.t('Disabled')+')');
				$schedule.prop('checked', false);
			} else {
				var nextTime = new Date(json.schedule.next_time * 1000);
				$message.text(json.schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString());
				$schedule.prop('checked', true);
			}
		} else {
			$message.text($.t('Error setting schedule'));
			$schedule.prop('checked', !isChecked);
			$schedule.prop('disabled', true);
			setTimeout(function() {
				$message.text(curMessage);
				$schedule.prop('disabled', false);
			}, 10000);
		}
	})
	.fail(function() {
		$message.text($.t('Error setting schedule')+', '+$.t('network error'));
		$schedule.prop('checked', !isChecked);
		$schedule.prop('disabled', true);
		setTimeout(function() {
			$message.text(curMessage);
			$schedule.prop('disabled', false);
		}, 10000);
	})
}

function refresh(force) {
	// Refresh schedules
	var urlSchedules = prefix+'/SCHEDULES/';
	$('#header-message-global').text($.t('Loading')+'...');
	var footerMessage="";
	var jqxhr = $.get( urlSchedules, function(dataSchedule) {
		var jsonSchedule = $.parseJSON(dataSchedule);
		for (var i=0; i<jsonSchedule.schedules.length; i++) {
			var schedule = jsonSchedule.schedules[i];
			var nextTime = new Date(schedule.next_time * 1000);
			if (!schedule.enabled) {
				$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+' '+$.t('Disabled'));
				$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', false);
				$('#message-schedule-'+schedule.id).text(schedule.name+' '+$.t('Disabled'));
				$('#schedule-'+schedule.id).prop('checked', false);
			} else {
				$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
				$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', true);
				$('#message-schedule-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
				$('#schedule-'+schedule.id).prop('checked', true);
			}
		}
	})
	.fail(function() {
		footerMessage = $.t('Error getting schedules');
		$('#header-message-global').text(footerMessage);
	});

	if (force) {
		url = prefix+'/REFRESH/';
	} else {
		url = prefix+'/OVERVIEW/';
	}
	// Refresh switches & sensors
	for (var key in devicesTab) {
		if (devicesTab[key].enabled) {
			var deviceId = devicesTab[key].name;
			var deviceDisplay = devicesTab[key].display;
			
			var jqxhr = $.get( url+deviceId, function(data) {
				var json = $.parseJSON(data);
				globalOverview[deviceId] = json.device;
				var device = json.device.name;
				
        var switches_list = json.device.switches;
				for (var j=0; j<switches_list.length; j++) {
					var switcher = switches_list[j];
					var $switch = $('#sw-'+device+'-'+switcher.name);
					$switch.prop('enabled', false);
					$switch.prop('checked', switcher.status==1);
					if ($('#label-sw-'+device+'-'+switcher.name).text() != switcher.display) {
						$('#label-sw-'+device+'-'+switcher.name).text(switcher.display+': ');
					}
					if (!switcher.enabled) {
						$('#p-switch-'+device+'-'+switcher.name).addClass('p-hidden');
					} else {
						$('#p-switch-'+device+'-'+switcher.name).removeClass('p-hidden');
					}
				}
				
        var sensors_list = json.device.sensors;
				for (var j=0; j<sensors_list.length; j++) {
					var sensor = sensors_list[j];
					$('#value-'+device+'-'+sensor.name).text(sensor.value+' '+sensor.unit);
					if ($('#label-'+device+'-'+sensor.name).text() != sensor.display) {
						$('#label-'+device+'-'+sensor.name).text(sensor.display+': ');
					}
					if (!sensor.enabled) {
						$('#p-'+device+'-'+sensor.name).hide();
					} else {
						$('#p-'+device+'-'+sensor.name).show();
					}
				}
				
        var heaters_list = json.device.heaters;
				for (var j=0; j<heaters_list.length; j++) {
					var heater = heaters_list[j];
					$('#he-'+device+'-'+heater.name).prop('disabled', true);
					$('#he-'+device+'-'+heater.name).prop('checked', heater.set);
					$('#he-slide-'+device+'-'+heater.name).slider('value', heater.max_value);
					$('#label-he-slide-'+device+'-'+heater.name).html(heater.max_value+' '+heater.unit);
					$('#message-he-'+device+'-'+heater.name).text('Chauffage');
					$('#he-slide-'+device+'-'+heater.name).slider('option', 'disabled', !heater.set);
					$('#he-'+device+'-'+heater.name).prop('disabled', false);
				}

        var dimmers_list = json.device.dimmers;
				for (var j=0; j<dimmers_list.length; j++) {
					var dimmer = dimmers_list[j];
					$('#di-slide-'+device+'-'+dimmer.name).slider('value', dimmer.value);
					$('#label-di-slide-'+device+'-'+dimmer.name).html(dimmer.value+' %');
				}

				$('#header-message-global').text('');
			})
			.fail(function() {
				footerMessage = $.t('Error when refreshing device ')+deviceDisplay;
				$('#header-message-global').text(footerMessage);
			});
		}
	}
	
	// Refresh camera files
	for (camera in globalCameras) {
		globalCameras[camera]['selected'] = $('#camera-list-'+camera).val();
		getCameraFiles(camera, false);
		getCameraFiles(camera, true);
	}
	
	var date = new Date();
	if (footerMessage != "") {
		$('#footer-message').text($.t('Last sync')+': '+date.toLocaleString()+'<br/>'+footerMessage);
	} else {
		$('#footer-message').text($.t('Last sync')+': '+date.toLocaleString());
	}
}

function updateMpds() {
	for (var device in devicesTab) {
		for (var key in globalMpd[device]) {
			updateMusic(device, globalMpd[device][key].name);
		}
	}
}

function editDevice(device) {
	var $dialog = $('#dialog-device');
	$dialog.find('#dialog-device-name').text(device.name);
	$dialog.find('#dialog-device-display').val(device.display);
	$dialog.find('#dialog-device-enabled').prop('checked', device.enabled);
  $dialog.find('#dialog-device-tags').tagsinput('removeAll');
	for (var key in device.tags) {
		$dialog.find('#dialog-device-tags').tagsinput('add', device.tags[key]);
	}
	
	$dialog.on('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			var curName=device.name;
			var curDisplay=$(this).find('#dialog-device-display').val();
			var curEnabled=$(this).find('#dialog-device-enabled').prop('checked')?'true':'false';
			var curTags=$(this).find('#dialog-device-tags').tagsinput('items').join();
			
			okDialogDevice(curName, curDisplay, curEnabled, curTags);
			
			$( this ).dialog( 'close' );
		}
	});
	
	$dialog.dialog({
		autoOpen: false,
		width: 400,
		modal: true,
		title: $.t('Edit a device'),
		buttons: [{
			text:$.t('Ok'),
			click:function() {
				var curName=device.name;
				var curDisplay=$(this).find('#dialog-device-display').val();
				var curEnabled=$(this).find('#dialog-device-enabled').prop('checked')?'true':'false';
				var curTags=$(this).find('#dialog-device-tags').tagsinput('items').join();
				
				okDialogDevice(curName, curDisplay, curEnabled, curTags);
				
				$( this ).dialog( 'close' );
			}
		}]
	});
	
	$dialog.dialog('open');
}

function okDialogDevice(curName, curDisplay, curEnabled, curTags) {
	var url = prefix+'/SETDEVICEDATA/';
	
	var $posting = $.post(url,
		{name: curName, display: curDisplay, enabled: curEnabled, tags: curTags}
	);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		$('a#href-'+json.device.name).text(json.device.display);
		
		for (var key in devicesTab) {
			if (devicesTab[key].name == curName) {
				devicesTab[key] = {name: curName, display: curDisplay, enabled: curEnabled, tags: curTags.split(',')};
			}
		}
	});
}

function monitorElement($button) {
	var device = $button.attr('data-an-device');
	var sensor = $button.attr('data-an-sensor');
	var switcher = $button.attr('data-an-switch');
	var dimmer = $button.attr('data-an-dimmer');
	var heater = $button.attr('data-an-heater');
	var unit = encodeURIComponent($button.attr('data-an-unit'));
	var startDate = '';
	var title = '';

	if (sensor === undefined) {
		sensor = '';
	} else {
		sensors = globalOverview[device].sensors;
		for (var i=0; i<sensors.length; i++) {
			if (sensor == sensors[i].name) {
				title = sensors[i].display;
			}
		}
  }
  
	if (switcher === undefined) {
		switcher = '';
	} else {
		switches = globalOverview[device].switches;
		for (var i=0; i<switches.length; i++) {
			if (switcher == switches[i].name) {
				title = switches[i].display;
			}
		}
	}
  
	if (dimmer === undefined) {
		dimmer = '';
	} else {
		dimmers = globalOverview[device].dimmers;
		for (var i=0; i<dimmers.length; i++) {
			if (dimmer == dimmers[i].name) {
				title = dimmers[i].display;
			}
		}
	}
  
	if (heater === undefined) {
		heater = '';
	} else {
		heaters = globalOverview[device].heaters;
		for (var i=0; i<heaters.length; i++) {
			if (heater == heaters[i].name) {
				title = heaters[i].display;
			}
		}
	}
	
	var curDate = new Date();
	var $dialog = $('#dialog-monitor');
	$dialog.find('#dialog-monitor-since').find('option[value="4"]').prop('selected', true);
	
	var iframe = '<iframe border="0" src="graph.html?device='+device+'&switcher='+switcher+'&sensor='+sensor+'&dimmer='+dimmer+'&heater='+heater+'&startDate='+startDate+'&unit='+unit+'" width="430px" height="350px"></iframe>';
	$dialog.find('#dialog-chart').html(iframe);
	
	$dialog.dialog({
		autoOpen: false,
		width: 460,
		height: 575,
		modal: true,
		title: title,
		buttons: [{
		text:$.t('Close'),
			open:function() {
				$select = $('#dialog-monitor-since');
				$select.unbind();
				$select.change(function() {
					switch ($select.val()) {
						case '0':
							// Last hour
							startDate = parseInt((new Date(curDate.getTime() - (1000*60*60))).getTime()/1000);
							break;
						case '1':
							// Last 2 hours
							startDate = parseInt((new Date(curDate.getTime() - (2*1000*60*60))).getTime()/1000);
							break;
						case '2':
							// Last 6 hours
							startDate = parseInt((new Date(curDate.getTime() - (6*1000*60*60))).getTime()/1000);
							break;
						case '3':
							// Last 12 hours
							startDate = parseInt((new Date(curDate.getTime() - (12*1000*60*60))).getTime()/1000);
							break;
						case '4':
							// Last day
							startDate = parseInt((new Date(curDate.getTime() - (24*1000*60*60))).getTime()/1000);
							break;
						case '5':
							// Last 2 days
							startDate = parseInt((new Date(curDate.getTime() - (48*1000*60*60))).getTime()/1000);
							break;
						case '6':
							// Last 3 days
							startDate = parseInt((new Date(curDate.getTime() - (72*1000*60*60))).getTime()/1000);
							break;
						case '7':
							// Last week
							startDate = parseInt((new Date(curDate.getTime() - (168*1000*60*60))).getTime()/1000);
							break;
						case '8':
							// Last month
							startDate = parseInt((new Date(curDate.getTime() - (720*1000*60*60))).getTime()/1000);
							break;
						default:
							break;
					}
					
					var iframe = '<iframe border="0" src="graph.html?device='+device+'&switcher='+switcher+'&sensor='+sensor+'&dimmer='+dimmer+'&heater='+heater+'&startDate='+startDate+'&unit='+unit+'" width="430px" height="350px"></iframe>';
					$('#dialog-chart').html(iframe);
					
				});
			},
			click:function() {
				$( this ).dialog( 'close' );
			}
		}]
	});

	$dialog.dialog('open');
}

function editSensor($sensorAdminButton) {
	for (var i=0; i<globalOverview[$sensorAdminButton.attr('data-an-device')].sensors.length; i++) {
		if ($sensorAdminButton.attr('data-an-sensor') == globalOverview[$sensorAdminButton.attr('data-an-device')].sensors[i].name) {
			var curSensor = globalOverview[$sensorAdminButton.attr('data-an-device')].sensors[i];
			var $dialog = $('#dialog-sensor');
			$dialog.find('#dialog-sensor-name').text(curSensor.name);
			$dialog.find('#dialog-sensor-display').val(curSensor.display);
			$dialog.find('#dialog-sensor-unit').val(curSensor.unit);
      $dialog.find('#dialog-sensor-value-type').find('option[value="'+(curSensor.value_type)+'"]').prop('selected', true);
			$dialog.find('#dialog-sensor-enabled').prop('checked', curSensor.enabled);
			$dialog.find('#dialog-sensor-monitored').prop('checked', curSensor.monitored);
			$dialog.find('#dialog-sensor-monitored-every').find('option[value="'+(curSensor.monitored_every==0?1:curSensor.monitored_every)+'"]').prop('selected', true);
      $dialog.find('#dialog-sensor-tags').tagsinput('removeAll');
      for (var key in curSensor.tags) {
        $dialog.find('#dialog-sensor-tags').tagsinput('add', curSensor.tags[key]);
      }
			
			if (!curSensor.monitored) {
				$dialog.find('#p-dialog-sensor-monitored-every').hide();
			} else {
				$dialog.find('#p-dialog-sensor-monitored-every').show();
			}
			
			$dialog.find('#dialog-sensor-monitored').unbind('change').change(function() {
				$dialog.find('#p-dialog-sensor-monitored-every').slideToggle();
			});
			
			$dialog.on('keypress', function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if(code == 13) {
					var curName=curSensor.name;
					var curDisplay=$(this).find('#dialog-sensor-display').val();
					var curUnit=$(this).find('#dialog-sensor-unit').val();
          var curValueType=$(this).find('#dialog-sensor-value-type').val()
					var curEnabled=$(this).find('#dialog-sensor-enabled').prop('checked')?'true':'false';
					var curMonitored=$(this).find('#dialog-sensor-monitored').prop('checked')?'true':'false';
					var curMonitoredEvery=$(this).find('#dialog-sensor-monitored-every').val();
          var curTags=$(this).find('#dialog-sensor-tags').tagsinput('items').join();
					
					okDialogSensor($sensorAdminButton.attr('data-an-device'), curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags);
					
					$( this ).dialog( 'close' );
				}
			});
			
			$dialog.dialog({
				autoOpen: false,
				width: 400,
				modal: true,
				title: $.t('Edit a sensor'),
				buttons: [{
					text:$.t('Ok'),
					click:function() {
						var curName=curSensor.name;
						var curDisplay=$(this).find('#dialog-sensor-display').val();
						var curUnit=$(this).find('#dialog-sensor-unit').val();
            var curValueType=$(this).find('#dialog-sensor-value-type').val()
						var curEnabled=$(this).find('#dialog-sensor-enabled').prop('checked')?'true':'false';
						var curMonitored=$(this).find('#dialog-sensor-monitored').prop('checked')?'true':'false';
						var curMonitoredEvery=$(this).find('#dialog-sensor-monitored-every').val();
            var curTags=$(this).find('#dialog-sensor-tags').tagsinput('items').join();
						
						okDialogSensor($sensorAdminButton.attr('data-an-device'), curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags);
						
						$( this ).dialog( 'close' );
					}
				}]
			});
			
			$dialog.dialog('open');
		}
	}
}

function okDialogSensor(curDevice, curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags) {
	var url = prefix+'/SETSENSORDATA/';
	var $posting = $.post(url,
		{name: curName, device: curDevice, display: curDisplay, unit: curUnit, value_type:curValueType, enabled: curEnabled, monitored: curMonitored, monitored_every: curMonitoredEvery, tags: curTags}
	);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		if (json.sensor.enabled) {
			$('#p-sensor-'+curDevice+'-'+curName).removeClass('p-hidden');
		} else {
			$('#p-sensor-'+curDevice+'-'+curName).addClass('p-hidden');
			$('#p-sensor-'+curDevice+'-'+curName).show();
		}
		var $label = $('#label-'+curDevice+'-'+curName);
		var $value = $('#value-'+curDevice+'-'+curName);
		$label.text(json.sensor.display+': ');
		$value.text($value.attr('value')+' '+json.sensor.unit);
		
		for (var i=0; i<globalOverview[curDevice].sensors.length; i++) {
			if (globalOverview[curDevice].sensors[i].name == curName) {
				globalOverview[curDevice].sensors[i].display = curDisplay;
				globalOverview[curDevice].sensors[i].unit = curUnit;
				globalOverview[curDevice].sensors[i].value_type = curValueType;
				globalOverview[curDevice].sensors[i].enabled = curEnabled;
				globalOverview[curDevice].sensors[i].monitored = curMonitored;
				globalOverview[curDevice].sensors[i].monitoredEvery = curMonitoredEvery;
				globalOverview[curDevice].sensors[i].tags = curTags.split(',');
			}
		}
	});
}

function editHeater($heaterAdminButton) {
	for (var i=0; i<globalOverview[$heaterAdminButton.attr('data-an-device')].heaters.length; i++) {
		if ($heaterAdminButton.attr('data-an-heater') == globalOverview[$heaterAdminButton.attr('data-an-device')].heaters[i].name) {
			var curHeater = globalOverview[$heaterAdminButton.attr('data-an-device')].heaters[i];
			var $dialog = $('#dialog-heater');
			$dialog.find('#dialog-heater-name').text(curHeater.name);
			$dialog.find('#dialog-heater-display').val(curHeater.display);
			$dialog.find('#dialog-heater-unit').val(curHeater.unit);
      $dialog.find('#dialog-heater-value-type').find('option[value="'+(curHeater.value_type)+'"]').prop('selected', true);
			$dialog.find('#dialog-heater-enabled').prop('checked', curHeater.enabled);
			$dialog.find('#dialog-heater-monitored').prop('checked', curHeater.monitored);
			$dialog.find('#dialog-heater-monitored-every').find('option[value="'+(curHeater.monitored_every==0?1:curHeater.monitored_every)+'"]').prop('selected', true);
      $dialog.find('#dialog-heater-tags').tagsinput('removeAll');
      for (var key in curHeater.tags) {
        $dialog.find('#dialog-heater-tags').tagsinput('add', curHeater.tags[key]);
      }
			
			if (!curHeater.monitored) {
				$dialog.find('#p-dialog-heater-monitored-every').hide();
			} else {
				$dialog.find('#p-dialog-heater-monitored-every').show();
			}
			
			$dialog.find('#dialog-heater-monitored').unbind('change').change(function() {
				$dialog.find('#p-dialog-heater-monitored-every').slideToggle();
			});
			
			$dialog.on('keypress', function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if(code == 13) {
					var curName=curHeater.name;
					var curDisplay=$(this).find('#dialog-heater-display').val();
					var curUnit=$(this).find('#dialog-heater-unit').val();
          var curValueType=$(this).find('#dialog-heater-value-type').val();
					var curEnabled=$(this).find('#dialog-heater-enabled').prop('checked')?'true':'false';
					var curMonitored=$(this).find('#dialog-heater-monitored').prop('checked')?'true':'false';
					var curMonitoredEvery=$(this).find('#dialog-heater-monitored-every').val();
          var curTags=$(this).find('#dialog-heater-tags').tagsinput('items').join();
					
					okDialogHeater($heaterAdminButton.attr('data-an-device'), curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags);
					
					$( this ).dialog( 'close' );
				}
			});
			
			$dialog.dialog({
				autoOpen: false,
				width: 400,
				modal: true,
				title: $.t('Edit a heater'),
				buttons: [{
					text:$.t('Ok'),
					click:function() {
						var curName=curHeater.name;
						var curDisplay=$(this).find('#dialog-heater-display').val();
						var curUnit=$(this).find('#dialog-heater-unit').val();
            var curValueType=$(this).find('#dialog-heater-value-type').val();
						var curEnabled=$(this).find('#dialog-heater-enabled').prop('checked')?'true':'false';
            var curMonitored=$(this).find('#dialog-heater-monitored').prop('checked')?'true':'false';
            var curMonitoredEvery=$(this).find('#dialog-heater-monitored-every').val();
            var curTags=$(this).find('#dialog-heater-tags').tagsinput('items').join();
            
						okDialogHeater($heaterAdminButton.attr('data-an-device'), curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags);
						$( this ).dialog( 'close' );
					}
				}]
			});
			
			$dialog.dialog('open');
		}
	}
}

function okDialogHeater(curDevice, curName, curDisplay, curUnit, curValueType, curEnabled, curMonitored, curMonitoredEvery, curTags) {
	var url = prefix+'/SETHEATERDATA/';
	var $posting = $.post(url,
		{name: curName, device: curDevice, display: curDisplay, unit: curUnit, value_type:curValueType, enabled: curEnabled, monitored: curMonitored, monitored_every: curMonitoredEvery, tags: curTags}
	);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		if (json.heater.enabled) {
			$('#p-heater-'+curDevice+'-'+curName).removeClass('p-hidden');
		} else {
			$('#p-heater-'+curDevice+'-'+curName).addClass('p-hidden');
			$('#label-he-slide-'+deviceId+'-'+heater.name).show();
			$('#he-slide-'+deviceId+'-'+heater.name).show();
			$('#p-heater-'+curDevice+'-'+curName).show();
		}
		var $label = $('#label-heater-'+curDevice+'-'+curName);
		var $value = $('#label-he-slide-'+curDevice+'-'+curName);
		var $slide = $('#he-slide-'+curDevice+'-'+curName);
		$label.text(json.heater.display);
		$value.html($slide.slider('value')+' '+curUnit);
		
		for (var i=0; i<globalOverview[curDevice].heaters.length; i++) {
			if (globalOverview[curDevice].heaters[i].name == curName) {
				globalOverview[curDevice].heaters[i].display = curDisplay;
				globalOverview[curDevice].heaters[i].unit = curUnit;
				globalOverview[curDevice].heaters[i].value_type = curValueType;
				globalOverview[curDevice].heaters[i].enabled = curEnabled;
				globalOverview[curDevice].heaters[i].monitored = curMonitored;
				globalOverview[curDevice].heaters[i].monitored_every = curMonitoredEvery;
				globalOverview[curDevice].heaters[i].tags = curTags.split(',');
			}
		}
	});
}

function editDimmer($dimmerAdminButton) {
	for (var i=0; i<globalOverview[$dimmerAdminButton.attr('data-an-device')].dimmers.length; i++) {
		if ($dimmerAdminButton.attr('data-an-dimmer') == globalOverview[$dimmerAdminButton.attr('data-an-device')].dimmers[i].name) {
			var curDimmer = globalOverview[$dimmerAdminButton.attr('data-an-device')].dimmers[i];
			var $dialog = $('#dialog-dimmer');
			$dialog.find('#dialog-dimmer-name').text(curDimmer.name);
			$dialog.find('#dialog-dimmer-display').val(curDimmer.display);
			$dialog.find('#dialog-dimmer-enabled').prop('checked', curDimmer.enabled);
			$dialog.find('#dialog-dimmer-monitored').prop('checked', curDimmer.monitored);
			$dialog.find('#dialog-dimmer-monitored-every').find('option[value="'+(curDimmer.monitored_every==0?1:curDimmer.monitored_every)+'"]').prop('selected', true);
      $dialog.find('#dialog-dimmer-tags').tagsinput('removeAll');
      for (var key in curDimmer.tags) {
        $dialog.find('#dialog-dimmer-tags').tagsinput('add', curDimmer.tags[key]);
      }
			
			if (!curDimmer.monitored) {
				$dialog.find('#p-dialog-dimmer-monitored-every').hide();
			} else {
				$dialog.find('#p-dialog-dimmer-monitored-every').show();
			}
			
			$dialog.find('#dialog-dimmer-monitored').unbind('change').change(function() {
				$dialog.find('#p-dialog-dimmer-monitored-every').slideToggle();
			});
			
			$dialog.on('keypress', function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if(code == 13) {
					var curName=curDimmer.name;
					var curDisplay=$(this).find('#dialog-dimmer-display').val();
					var curEnabled=$(this).find('#dialog-dimmer-enabled').prop('checked')?'true':'false';
					var curMonitored=$(this).find('#dialog-dimmer-monitored').prop('checked')?'true':'false';
					var curMonitoredEvery=$(this).find('#dialog-dimmer-monitored-every').val();
          var curTags=$(this).find('#dialog-dimmer-tags').tagsinput('items').join();
					
					okDialogDimmer($dimmerAdminButton.attr('data-an-device'), curName, curDisplay, curEnabled, curMonitored, curMonitoredEvery, curTags);
					
					$( this ).dialog( 'close' );
				}
			});
			
			$dialog.dialog({
				autoOpen: false,
				width: 400,
				modal: true,
				title: $.t('Edit a dimmer'),
				buttons: [{
					text:$.t('Ok'),
					click:function() {
						var curName=curDimmer.name;
						var curDisplay=$(this).find('#dialog-dimmer-display').val();
						var curEnabled=$(this).find('#dialog-dimmer-enabled').prop('checked')?'true':'false';
            var curMonitored=$(this).find('#dialog-dimmer-monitored').prop('checked')?'true':'false';
            var curMonitoredEvery=$(this).find('#dialog-dimmer-monitored-every').val();
            var curTags=$(this).find('#dialog-dimmer-tags').tagsinput('items').join();
						
						okDialogDimmer($dimmerAdminButton.attr('data-an-device'), curName, curDisplay, curEnabled, curMonitored, curMonitoredEvery, curTags);
						
						$( this ).dialog( 'close' );
					}
				}]
			});
			
			$dialog.dialog('open');
		}
	}
}

function okDialogDimmer(curDevice, curName, curDisplay, curEnabled, curMonitored, curMonitoredEvery, curTags) {
	var url = prefix+'/SETDIMMERDATA/';
	var $posting = $.post(url,
		{name: curName, device: curDevice, display: curDisplay, enabled: curEnabled, monitored: curMonitored, monitored_every: curMonitoredEvery, tags: curTags}
	);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		if (json.dimmer.enabled) {
			$('#p-dimmer-'+curDevice+'-'+curName).removeClass('p-hidden');
		} else {
			$('#p-dimmer-'+curDevice+'-'+curName).addClass('p-hidden');
			$('#p-dimmer-'+curDevice+'-'+curName).show();
		}
		var $label = $('#label-dimmer-'+curDevice+'-'+curName);
		var $value = $('#value-dimmer-'+curDevice+'-'+curName);
		$label.text(json.dimmer.display);
		$value.text($value.attr('value'));
		
		for (var i=0; i<globalOverview[curDevice].dimmers.length; i++) {
			if (globalOverview[curDevice].dimmers[i].name == curName) {
				globalOverview[curDevice].dimmers[i].display = curDisplay;
				globalOverview[curDevice].dimmers[i].enabled = curEnabled;
				globalOverview[curDevice].dimmers[i].monitored = curMonitored;
				globalOverview[curDevice].dimmers[i].monitored_every = curMonitoredEvery;
				globalOverview[curDevice].dimmers[i].tags = curTags.split(',');
			}
		}
	});
}

function editSwitch($switchAdminButton) {
	for (var i=0; i<globalOverview[$switchAdminButton.attr('data-an-device')].switches.length; i++) {
		if ($switchAdminButton.attr('data-an-switch') == globalOverview[$switchAdminButton.attr('data-an-device')].switches[i].name) {
			var curSwitch = globalOverview[$switchAdminButton.attr('data-an-device')].switches[i];
			var $dialog = $('#dialog-switch');
			$dialog.find('#dialog-switch-name').text(curSwitch.name);
			$dialog.find('#dialog-switch-display').val(curSwitch.display);
			$dialog.find('#dialog-switch-type').find('option[value="'+curSwitch.type+'"]').prop('selected', true);
			$dialog.find('#dialog-switch-enabled').prop('checked', curSwitch.enabled);
			$dialog.find('#dialog-switch-monitored').prop('checked', curSwitch.monitored);
			$dialog.find('#dialog-switch-monitored-every').find('option[value="'+(curSwitch.monitored_every==0?1:curSwitch.monitored_every)+'"]').prop('selected', true);
      $dialog.find('#dialog-switch-tags').tagsinput('removeAll');
      for (var key in curSwitch.tags) {
        $dialog.find('#dialog-switch-tags').tagsinput('add', curSwitch.tags[key]);
      }
			
			if (!curSwitch.monitored) {
				$dialog.find('#p-dialog-switch-monitored-every').hide();
			} else {
				$dialog.find('#p-dialog-switch-monitored-every').show();
			}
			
			$dialog.find('#dialog-switch-monitored').unbind('change').change(function() {
				$dialog.find('#p-dialog-switch-monitored-every').slideToggle();
			});
			
			$dialog.on('keypress', function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if(code == 13) {
					var curName=curSwitch.name;
					var curDisplay=$(this).find('#dialog-switch-display').val();
					var curType=$(this).find('#dialog-switch-type').val();
					var curEnabled=$(this).find('#dialog-switch-enabled').prop('checked')?'true':'false';
					var curMonitored=$(this).find('#dialog-switch-monitored').prop('checked')?'true':'false';
					var curMonitoredEvery=$(this).find('#dialog-switch-monitored-every').val();
          var curTags=$(this).find('#dialog-switch-tags').tagsinput('items').join();
					
					okDialogSwitch($switchAdminButton.attr('data-an-device'), curName, curDisplay, curType, curEnabled, curMonitored, curMonitoredEvery, curTags);
					
					$( this ).dialog( 'close' );
				}
			});
			
			$dialog.dialog({
				autoOpen: false,
				width: 400,
				modal: true,
				title: $.t('Edit a switch'),
				buttons: [{
					text:$.t('Ok'),
					click:function() {
						var curName=curSwitch.name;
						var curDisplay=$(this).find('#dialog-switch-display').val();
						var curType=$(this).find('#dialog-switch-type').val();
						var curEnabled=$(this).find('#dialog-switch-enabled').prop('checked')?'true':'false';
						var curMonitored=$(this).find('#dialog-switch-monitored').prop('checked')?'true':'false';
						var curMonitoredEvery=$(this).find('#dialog-switch-monitored-every').val();
            var curTags=$(this).find('#dialog-switch-tags').tagsinput('items').join();
						
						okDialogSwitch($switchAdminButton.attr('data-an-device'), curName, curDisplay, curType, curEnabled, curMonitored, curMonitoredEvery, curTags);
						
						$( this ).dialog( 'close' );
					}
				}]
			});
			
			$dialog.dialog('open');
		}
	}
}

function okDialogSwitch(curDevice, curName, curDisplay, curType, curEnabled, curMonitored, curMonitoredEvery, curTags) {
	var url = prefix+'/SETSWITCHDATA/';
	var $posting = $.post(url,
		{name: curName, device: curDevice, display: curDisplay, type: curType, enabled: curEnabled, monitored: curMonitored, monitored_every: curMonitoredEvery, tags: curTags}
	);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		var $p = $('#p-switch-'+curDevice+'-'+curName);
		if (json.switch.enabled) {
			$p.removeClass('p-hidden');
		} else {
			$p.addClass('p-hidden');
			$p.show();
		}
		if (json.switch.type == 0) {
			$p.removeClass('sw-type-nc');
			$p.removeClass('sw-type-tw');
		} else if (json.switch.type == 1) {
			$p.addClass('sw-type-nc');
			$p.removeClass('sw-type-tw');
		} else if (json.switch.type == 2) {
			$p.removeClass('sw-type-nc');
			$p.addClass('sw-type-tw');
		}
		var $label = $('#label-sw-'+curDevice+'-'+curName);
		$label.text(json.switch.display);
		
		for (var i=0; i<globalOverview[curDevice].switches.length; i++) {
			if (globalOverview[curDevice].switches[i].name == curName) {
				globalOverview[curDevice].switches[i].display = curDisplay;
				globalOverview[curDevice].switches[i].enabled = curEnabled;
				globalOverview[curDevice].switches[i].monitored = curMonitored;
				globalOverview[curDevice].switches[i].monitoredEvery = curMonitoredEvery;
        globalOverview[curDevice].switches[i].tags = curTags.split(',');
			}
		}
	});
}

function initActions() {
	var urlScripts = prefix+'/ACTIONS/';
	var jqxhr = $.get( urlScripts, function(dataScripts) {
		var jsonActions = $.parseJSON(dataScripts);
		for (var i=0; i<jsonActions.actions.length; i++) {
			var action = jsonActions.actions[i];
			globalActions[action.id] = action;
			var htmlAction = '<p id="p-admin-global-action-'+action.id+'"><input type="button" id="admin-global-action-'+action.id+'" name="admin-global-action-'+action.id+'" data-an-action-id="'+action.id+'" class="admin-button admin-modify-delete" value="+"><label id="global-action-name-'+action.id+'">'+action.name+'</label></p>\n';
			$('#action-global .inside').append(htmlAction);
		}
		
		$('#admin-action-global-add').click(function() {
			editAction(null);
		});
	})
	.fail(function() {
		$message.text('Error setting actions');
	})
}

function editAction($action) {
	var $dialog = $('#dialog-action');
	var title = $.t('Edit an action');
	if ($action == null) {
		title = $.t('Add an action');
	}
	
	initActionDialog($dialog, $action);
	$dialog.on('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			okAction($dialog);
		}
	});
	
	$dialog.dialog({
		autoOpen: false,
		width: 500,
		modal: true,
		title: title,
		buttons: [{
			text:$.t('Ok'),
			click:function() {
				okAction($dialog);
			}
		}]
	});
	
	$dialog.dialog('open');
	
}

function initActionDialog($dialog, $action) {
	var $tags = $dialog.find('#dialog-action-tags');
	var $devicesList = $dialog.find('#dialog-action-device');
	var $switchesList = $dialog.find('#dialog-action-switcher');
	var $dimmersList = $dialog.find('#dialog-action-dimmer');
	var $heatersList = $dialog.find('#dialog-action-heater');
	var $scriptsList = $dialog.find('#dialog-action-script');
	var $typeList = $dialog.find('#dialog-action-type');
	var $paramsSetSwitch = $dialog.find('#dialog-action-params-setswitcher');
	var $paramsValue = $dialog.find('#dialog-action-params-value');
	var $pParams = $dialog.find('#p-dialog-action-params');
	var $pParamsSetSwitch = $dialog.find('#p-dialog-action-params-setswitcher');
	var $pParamsSetDimmer = $dialog.find('#p-dialog-action-params-setdimmer');
	var $pParamsValue = $dialog.find('#p-dialog-action-params-value');
	
	$devicesList.empty();
	for (var key in devicesTab) {
		if (devicesTab[key].enabled) {
			var htmlOption = '<option value="'+devicesTab[key].name+'">'+devicesTab[key].display+'</option>';
			$devicesList.append(htmlOption);
		}
	}
  
  $scriptsList.empty();
	for (var key in globalScripts) {
    var htmlOption = '<option value="'+globalScripts[key].id+'">'+globalScripts[key].name+'</option>';
    $scriptsList.append(htmlOption);
	}
	
	$typeList.change(function () {
		switch ($(this).val().toString()) {
			case "0":
				// SET_SWITCH
				$devicesList.prop('disabled', false);
				$switchesList.prop('disabled', false);
				$dimmersList.prop('disabled', true);
				$heatersList.prop('disabled', true);
        $scriptsList.prop('disabled', true);
				$pParams.slideUp();
				$pParamsSetSwitch.slideDown();
				$pParamsSetDimmer.slideUp();
				$pParamsValue.slideUp();
				break;
			case "1":
				// TOGGLE_SWITCH
				$devicesList.prop('disabled', false);
				$switchesList.prop('disabled', false);
				$dimmersList.prop('disabled', true);
				$heatersList.prop('disabled', true);
        $scriptsList.prop('disabled', true);
				$pParams.slideUp();
				$pParamsSetSwitch.slideUp();
				$pParamsSetDimmer.slideUp();
				$pParamsValue.slideUp();
				break;
			case "2":
				// DIMMER
				$devicesList.prop('disabled', false);
				$switchesList.prop('disabled', true);
				$dimmersList.prop('disabled', false);
				$heatersList.prop('disabled', true);
        $scriptsList.prop('disabled', true);
				$pParams.slideUp();
				$pParamsSetSwitch.slideUp();
				$pParamsSetDimmer.slideDown();
				$pParamsValue.slideDown();
				break;
			case "3":
				// HEATER
				$devicesList.prop('disabled', false);
				$switchesList.prop('disabled', true);
				$dimmersList.prop('disabled', true);
				$heatersList.prop('disabled', false);
        $scriptsList.prop('disabled', true);
				$pParams.slideUp();
        $paramsSetSwitch.find('option[value="0"]').text($.t('Off'));
        $paramsSetSwitch.find('option[value="1"]').text($.t('On'));
				$pParamsSetSwitch.slideDown();
				$pParamsSetDimmer.slideUp();
				$pParamsValue.slideDown();
				break;
			case "77":
				// SCRIPT
				$devicesList.prop('disabled', true);
				$switchesList.prop('disabled', true);
				$dimmersList.prop('disabled', true);
				$heatersList.prop('disabled', true);
        $scriptsList.prop('disabled', false);
				$pParams.slideUp();
				$pParamsSetSwitch.slideUp();
				$pParamsSetDimmer.slideUp();
				$pParamsValue.slideUp();
				break;
			case "88":
				// SLEEP
			case "99":
				// SYSTEM
				$devicesList.prop('disabled', true);
				$switchesList.prop('disabled', true);
				$dimmersList.prop('disabled', true);
				$heatersList.prop('disabled', true);
        $scriptsList.prop('disabled', true);
				$pParams.slideUp();
				$pParamsSetSwitch.slideUp();
				$pParamsSetDimmer.slideUp();
				$pParamsValue.slideDown();
				break;
			default:
				break;
		}
	});
	
	$devicesList.change(function() {
		
		$switchesList.empty();
		var switches = globalOverview[$(this).val()].switches;
		for (var i=0; i<switches.length; i++) {
			if (switches[i].enabled) {
				var htmlOption = '<option value="'+switches[i].name+'">'+switches[i].display+'</option>\n';
				$switchesList.append(htmlOption);
			}
		}
		
		$dimmersList.empty();
		var dimmers = globalOverview[$(this).val()].dimmers;
		for (var i=0; i<dimmers.length; i++) {
			var htmlOption = '<option value="'+dimmers[i].name+'">'+dimmers[i].display+'</option>\n';
			$dimmersList.append(htmlOption);
		}
		
		$heatersList.empty();
		var heaters = globalOverview[$(this).val()].heaters;
		for (var i=0; i<heaters.length; i++) {
			var htmlOption = '<option value="'+heaters[i].name+'">'+heaters[i].display+'</option>\n';
			$heatersList.append(htmlOption);
		}
	});
	
	$switchesList.change(function() {
		var switcherName = $(this).val();
		var switcher = null;
		for (var i=0; i<globalOverview[$devicesList.val()].switches.length; i++) {
			if (globalOverview[$devicesList.val()].switches[i].name == switcherName) {
				switcher = globalOverview[$devicesList.val()].switches[i];
			}
		}
		if (switcher.type == 0) {
			$paramsSetSwitch.find('option[value="0"]').text($.t('Off'));
			$paramsSetSwitch.find('option[value="1"]').text($.t('On'));
		} else if (switcher.type == 1) {
			$paramsSetSwitch.find('option[value="0"]').text($.t('On'));
			$paramsSetSwitch.find('option[value="1"]').text($.t('Off'));
		} else if (switcher.type == 2) {
			$paramsSetSwitch.find('option[value="0"]').text($.t('Left'));
			$paramsSetSwitch.find('option[value="1"]').text($.t('Right'));
		}
	});
	
	$typeList.trigger('change');
  
	$devicesList.trigger('change');

	if ($action != null) {
		var action = globalActions[$action.attr('data-an-action-id')];
		$('#dialog-action-id').val(action.id);
		$('#dialog-action-name').val(action.name);
		$tags.tagsinput('removeAll');
		for (var key in action.tags) {
			$tags.tagsinput('add', action.tags[key]);
		}
		$typeList.find('option[value="'+action.type+'"]').prop('selected', true);
		$devicesList.find('option[value="'+action.device+'"]').prop('selected', true);
		$typeList.trigger('change');
		$devicesList.trigger('change');
		$switchesList.find('option[value="'+action.switcher+'"]').prop('selected', true);
		$switchesList.trigger('change');
		$dimmersList.find('option[value="'+action.dimmer+'"]').prop('selected', true);
		if (action.type == 0 || action.type == 1) { // SETSWITCH || TOGGLESWITCH
			if (action.params == "1") {
				$paramsSetSwitch.find('option[value="1"]').prop('selected', true);
			} else {
				$paramsSetSwitch.find('option[value="0"]').prop('selected', true);
			}
			$paramsValue.val('');
		} else if (action.type == 2) { // DIMMER
      $paramsValue.val(action.params);
		} else if (action.type == 3) { // HEATER
			var values = action.params.split(',');
			$paramsSetSwitch.find('option[value="'+values[0]+'"]').prop('selected', true);
			$paramsValue.val(values[1]);
		} else if (action.type == 77) {
			$scriptsList.find('option[value="'+action.params+'"]').prop('selected', true);
		} else if (action.type == 99 || action.type == 88) {
			$paramsSetSwitch.find('option[value="0"]').prop('selected', true);
			$paramsValue.val(action.params);
		} else {
			$paramsSetSwitch.find('option[value="0"]').prop('selected', true);
			$paramsValue.val('');
		}
	} else {
		$('#dialog-action-id').val('');
		$('#dialog-action-name').val('');
		$tags.tagsinput('removeAll');
		$typeList.find('option[value="0"]').prop('selected', true);
		$devicesList.find('option[0]').prop('selected', true);
		$switchesList.find('option[0]').prop('selected', true);
		$dimmersList.find('option[0]').prop('selected', true);
		$paramsSetSwitch.find('option[value="0"]').prop('selected', true);
		$paramsValue.val('');
	}
}

function okAction($dialog) {
	var url = prefix;
	var isAdd = true;
	var params = {};
	var $paramsSetSwitch = $dialog.find('#dialog-action-params-setswitcher');
	var $paramsValue = $dialog.find('#dialog-action-params-value');
  var $paramsScript = $dialog.find('#dialog-action-script');
	
	if ($dialog.find('#dialog-action-id').val() == '') {
		// Add action
		url += '/ADDACTION';
	} else {
		// Edit action
		url += '/SETACTION';
		isAdd = false;
		params.id = $dialog.find('#dialog-action-id').val();
	}
		
	params.name = $dialog.find('#dialog-action-name').val();
	params.tags = $dialog.find('#dialog-action-tags').tagsinput('items').join();
	params.type = $dialog.find('#dialog-action-type').val();
	params.device = $dialog.find('#dialog-action-device').val();
	params.switcher = $dialog.find('#dialog-action-switcher').val();
	params.dimmer = $dialog.find('#dialog-action-dimmer').val();
	params.heater = $dialog.find('#dialog-action-heater').val();
	
	if (params.name == '') {
		alert($.t('Enter action name'));
		return false;
	}
	if (params.type == 0) { // SETSWITCH
		params.params = $paramsSetSwitch.val();
	} else if (params.type == 2) { // DIMMER
		if ($paramsValue.val() == '' || isNaN($paramsValue.val()) || $paramsValue.val() < 0 || $paramsValue.val() > 99) {
			alert($.t('Dimmer value must be numeric between 0 and 99'));
			return false;
		}
		params.params = $paramsValue.val();
	} else if (params.type == 3) { // HEATER
		if ($paramsValue.val() == '' || isNaN($paramsValue.val())) {
			alert($.t('Heat value must be numeric'));
			return false;
		}
		params.params = $paramsSetSwitch.val()+','+$paramsValue.val();
	} else if (params.type == 77) { // SCRIPT
    params.params = $paramsScript.val();
	} else if (params.type == 88) { // SLEEP
		if ($paramsValue.val() == '') {
			alert($.t('Duration must be in milliseconds'));
			return false;
		}
		params.params = $paramsValue.val();
	} else if (params.type == 99) { // SYSTEM
		if ($paramsValue.val() == '') {
			alert($.t('You must enter a server command'));
			return false;
		}
		params.params = $paramsValue.val();
	}
	
	var $posting = $.post(url, params);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		var action = json.action;
		if (isAdd) {
			globalActions[action.id] = action;
			var htmlAction = '<p id="p-admin-global-action-'+action.id+'"><input type="button" id="admin-global-action-'+action.id+'" name="admin-global-action-'+action.id+'" data-an-action-id="'+action.id+'" class="admin-button admin-modify-delete" value="+"><label id="global-action-name-'+action.id+'">'+action.name+'</label></p>\n';
			$('#action-global .inside').append(htmlAction);
			$('#admin-global-action-'+action.id).slideDown();
		} else {
			globalActions[action.id] = action;
			$('#global-action-name-'+action.id).text(action.name);
		}
	});
	
	$dialog.dialog( 'close' );
}

function deleteAction($action) {
	var url = prefix + '/DELETEACTION/'+$action.attr('data-an-action-id');
	
	if (confirm($.t('Are you sure you want to delete this action ?'))) {
		var jqxhr = $.get( url, function(data) {
			var json = $.parseJSON(data);
			if (json.result == "ok") {
				$('#p-admin-global-action-'+$action.attr('data-an-action-id')).slideUp();
				$('#p-admin-global-action-'+$action.attr('data-an-action-id')).remove();
			}
		})
		.fail(function() {
			$('#footer-message-global').text($.t('Error deleting action'));
		});
	}
}

function editScript($script) {
	var $dialog = $('#dialog-script');
	var title = $.t('Edit a task');
	if ($script == null) {
		title = $.t('Add a task');
	}
		
	initScriptDialog($dialog, $script);
	$dialog.on('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			okScript($dialog);
		}
	});
	
	$dialog.dialog({
		autoOpen: false,
		width: 500,
		modal: true,
		title: title,
		buttons: [{
			text:$.t('Ok'),
			click:function() {
				okScript($dialog);
			}
		}]
	});
	
	$dialog.dialog('open');
	
}

function initScriptDialog($dialog, $script) {
	var $devicesList = $('#dialog-script-device');
	var $scriptActionsList = $('#dialog-script-actions');
	var $actionsList = $('#dialog-script-action-list');
  var $tags = $dialog.find('#dialog-script-tags');
	
	
	$devicesList.empty();
	$devicesList.append('<option value="">'+$.t('None')+'</option>');
	for (var key in devicesTab) {
		if (devicesTab[key].enabled) {
			var htmlOption = '<option value="'+devicesTab[key].name+'">'+devicesTab[key].display+'</option>\n';
			$devicesList.append(htmlOption);
		}
	}
	
	$scriptActionsList.empty();
	if ($script != null) {
		var script = globalScripts[$script.attr('data-an-script-id')];
		$('#dialog-script-id').val(script.id);
		$('#dialog-script-name').val(script.name);
		$('#dialog-script-enabled').prop('checked', script.enabled);
		$('#dialog-script-device').find('option[value="'+script.device+'"]').prop('selected', true);
		for (var i=0; i<script.actions.length; i++) {
			var action = script.actions[i];
			var htmlOption = '<option value="'+action.id+'" data-an-enabled="'+action.enabled+'" class="'+(action.enabled?'an-enabled':'an-disabled')+'">'+action.name+'</option>\n';
			$scriptActionsList.append(htmlOption);
		}
    $tags.tagsinput('removeAll');
    for (var key in script.tags) {
      $tags.tagsinput('add', script.tags[key]);
    }
	} else {
		$('#dialog-script-id').val('');
		$('#dialog-script-name').val('');
		$('#dialog-script-enabled').prop('checked', true);
    $tags.tagsinput('removeAll');
	}
	
	$actionsList.empty();
	for (var i=0; i<globalActions.length; i++) {
		if (globalActions[i] != undefined) {
			var htmlOption = '<option value="'+globalActions[i].id+'">'+globalActions[i].name+'</option>\n';
			$actionsList.append(htmlOption);
		}
	}
	
	$('#dialog-script-action-up').off('click').click(function () {
		var $actionSelected = $('#dialog-script-actions').find('option:selected');
		if ($actionSelected.prev() != undefined) {
			$actionSelected.insertBefore($actionSelected.prev());
		}
	});
	
	$('#dialog-script-action-down').off('click').click(function () {
		var $actionSelected = $('#dialog-script-actions').find('option:selected');
		if ($actionSelected.next() != undefined) {
			$actionSelected.insertAfter($actionSelected.next());
		}
	});
	
	$('#dialog-script-action-remove').off('click').click(function () {
		$('#dialog-script-actions').find('option:selected').remove();
	});
	
	$('#dialog-script-action-add').off('click').click(function () {
		var actionId = $('#dialog-script-action-list').find('option:selected').val();
		var actionName = $('#dialog-script-action-list').find('option:selected').text();
		
		var htmlOption = '<option value="'+actionId+'" data-an-enabled="true" class="an-enabled">'+actionName+'</option>';
		$scriptActionsList.append(htmlOption);
	});
  
  $('#dialog-script-actions').dblclick(function () {
    var $option = $(this).find("option:selected");
    if ($option.attr('data-an-enabled') == 'true') {
      $option.attr('data-an-enabled', 'false');
      $option.attr('class', 'an-disabled');
    } else {
      $option.attr('data-an-enabled', 'true');
      $option.attr('class', 'an-enabled');
    }
  });
}

function okScript($dialog) {
	var url = prefix;
	var postParams = {};
	var isAdd = true;
	var scriptName = '';
	var scriptId = '';
	
	if ($dialog.find('#dialog-script-id').val() != '') {
		url += '/SETSCRIPT';
		postParams.id = $dialog.find('#dialog-script-id').val();
		isAdd = false;
	} else {
		url += '/ADDSCRIPT';
	}
	postParams.name = $dialog.find('#dialog-script-name').val();
	postParams.enabled = $dialog.find('#dialog-script-enabled').prop('checked')?'true':'false';
  postParams.tags = $dialog.find('#dialog-script-tags').tagsinput('items').join();
	
	if ($dialog.find('#dialog-script-device').val() != '') {
		postParams.device = $dialog.find('#dialog-script-device').val();
	}
	
	postParams.actions='';
	$dialog.find('#dialog-script-actions option').each(function () {
		if (postParams.actions != '') {
			postParams.actions += ';';
		}
		postParams.actions += $(this).val() + ',' + ($(this).attr('data-an-enabled')=='true'?'1':'0');
	});
  
  if (postParams.name === '') {
    alert($.t('You must enter a script name'));
    return false;
  } else if (postParams.actions === '') {
    alert($.t('You must add at least one action'));
    return false;
  }
	
	var $posting = $.post(url, postParams);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
    if (json.result != 'error') {
      var script = json.script;
      script.actions = [];
      var i=0;
      $dialog.find('#dialog-script-actions option').each(function () {
        script.actions[i] = {id:$(this).val(), name:$(this).text(), enabled:$(this).attr('data-an-enabled')=='true', rank:i+1};
        i++;
      });
      globalScripts[script.id] = script;
      scriptId = script.id;
      scriptName = script.name;
      if (isAdd) {
        var enabled = script.enabled?'enabled="true"':'enabled="false"';
        var htmlScript = '<p><input type="button" id="admin-global-script-'+script.id+'" name="admin-global-script-'+script.id+'" data-an-script-id="'+script.id+'" class="admin-button admin-modify-delete" value="+"><input type="button" data-an-script-id="'+script.id+'" data-an-device="" name="script-'+script.id+'" id="script-'+script.id+'" value="'+script.name+'" '+enabled+' class="styled-button"><label id="message-script-'+script.id+'"></label></p>\n';
        $('#script-global .inside').append(htmlScript);
        if (adminGlobal) {
          $('#admin-global-script-'+script.id).slideDown();
        } else {
          $('#admin-global-script-'+script.id).slideUp();
        }
        $('#script-'+script.id).click(function() {
          runScript(this);
        });
        
        if (script.device != "") {
          htmlScript = '<p><input type="button" id="admin-script-'+script.id+'" name="admin-script-'+script.id+'" data-an-script-id="'+script.id+'" class="admin-button admin-modify-delete" value="+"><input type="button" data-an-script-id="'+script.id+'" data-an-device="'+script.device+'" name="script-'+script.device+'-'+script.id+'" id="script-'+script.device+'-'+script.id+'" value="'+script.name+'" '+enabled+' class="styled-button"/><label id="message-script-'+script.device+'-'+script.id+'"></label></p>\n';
          $('#script-'+script.device+' .inside').append(htmlScript);
          if (devicesTab[script.device].admin) {
            $('#admin-script-'+script.id).slideDown();
          } else {
            $('#admin-script-'+script.id).slideUp();
          }

          $('#script-'+script.device+'-'+script.id).click(function() {
            runScript(this);
          });
        }
        var urlAction = prefix + '/ADDACTION/';
        var params = {};
        params.name = 'script - '+scriptName;
        params.type = 77;
        params.device = '';
        params.dimmers = '';
        params.switcher = '';
        params.heater = '';
        params.params = scriptId;
        
        var $postingAction = $.post(urlAction, params);
        $postingAction.done(function(dataAction) {
          var jsonAction = $.parseJSON(dataAction)
          var newAction = jsonAction.action;
          globalActions[newAction.id] = newAction;
          var htmlAction = '<p id="p-admin-global-action-'+newAction.id+'"><input type="button" id="admin-global-action-'+newAction.id+'" name="admin-global-action-'+newAction.id+'" data-an-action-id="'+newAction.id+'" class="admin-button admin-modify-delete" value="+"><label id="global-action-name-'+newAction.id+'">'+newAction.name+'</label></p>\n';
          $('#action-global .inside').append(htmlAction);
          if (adminGlobal) {
            $('#admin-global-action-'+newAction.id).slideDown();
          } else {
            $('#admin-global-action-'+newAction.id).slideUp();
          }
        });
      } else {
        $('#script-'+script.id).val(script.name);
        for (var key in devicesTab) {
          if ($('#script-'+devicesTab[key].name+'-'+script.id).length > 0) {
            $('#script-'+devicesTab[key].name+'-'+script.id).val(script.name);
          }
        }
      }
    }
	});
	$dialog.dialog( 'close' ); 
}

function deleteScript($script) {
	var scriptId = $script.attr('data-an-script-id');
	var url = prefix + '/DELETESCRIPT/'+scriptId;
	
	if (confirm($.t('Are you sure you want to delete this task ?'))) {
		var jqxhr = $.get( url, function(data) {
			var json = $.parseJSON(data);
			if (json.result == "ok") {
				$('#admin-global-script-'+scriptId).parent().slideUp();
				$('#admin-global-script-'+scriptId).parent().remove();
				for (var key in devicesTab) {
					if ($('#script-'+devicesTab[key].name+'-'+scriptId).length > 0) {
						$('#script-'+devicesTab[key].name+'-'+scriptId).parent().slideUp();
						$('#script-'+devicesTab[key].name+'-'+scriptId).parent().remove();
					}
				}
			}
		})
		.fail(function() {
			$('#footer-message-global').text($.t('Error deleting task'));
		});
	}
}

function editSchedule($schedule) {
	var $dialog = $('#dialog-schedule');
	var title = $.t('Edit a scheduled task');
	if ($schedule == null) {
		title = $.t('Add a scheduled task');
	}
	
	$dialog.on('keypress', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			okSchedule($dialog);
		}
	});
	
	$dialog.dialog({
		autoOpen: false,
		width: 500,
		modal: true,
		title: title,
		buttons: [{
			text:$.t('Ok'),
			click:function() {
				okSchedule($dialog);
			}
		}]
	});
	
	$dialog.dialog('open');
	
	initDialogSchedule($dialog, $schedule);
				
}

function initDialogSchedule($dialog, $schedule) {
	$('#dialog-schedule-date').datepicker({
		showOn: "button",
		buttonImage: "images/calendar.gif",
		buttonImageOnly: true,
		option: $.datepicker.regional["fr"],
		dateFormat: "dd/mm/yy"
	});
	
	$('#dialog-schedule-script').empty();
	for (var key in globalScripts) {
		if (globalScripts[key] != undefined && globalScripts[key].enabled) {
			var htmlOption = '<option value="'+globalScripts[key].id+'">'+globalScripts[key].name+'</option>\n';
			$('#dialog-schedule-script').append(htmlOption);
		}
	}
	
	$('#dialog-schedule-device').empty();
	$('#dialog-schedule-device').append('<option value="">'+$.t('None')+'</option>\n');
	for (var key in devicesTab) {
		if (devicesTab[key].enabled) {
			var htmlOption = '<option value="'+devicesTab[key].name+'">'+devicesTab[key].display+'</option>\n';
			$('#dialog-schedule-device').append(htmlOption);
		}
	}
	
	$('#dialog-schedule-repeat').change(function () {
		if ($(this).prop('checked')) {
			$('.p-dialog-schedule-repeat-every').slideDown();
			$('#dialog-schedule-repeat-every').trigger('change');
			$('.p-dialog-schedule-remove-after-done').slideUp();
		} else {
			$('.p-dialog-schedule-repeat-every').slideUp();
			$('.p-dialog-schedule-repeat-value-dow').slideUp();
			$('.p-dialog-schedule-remove-after-done').slideDown();
		}
	});
	
	$('#dialog-schedule-repeat-every').change(function () {
		if ($(this).val() == '3') {
			$('.p-dialog-schedule-repeat-value-dow').slideDown();
			$('#dialog-schedule-repeat-value').slideUp();
		} else {
			$('.p-dialog-schedule-repeat-value-dow').slideUp();
			$('#dialog-schedule-repeat-value').slideDown();
		}
	});
	
	if ($schedule == null) {
		$('#dialog-schedule-id').val('');
		$('#dialog-schedule-name').val('');
		$('#dialog-schedule-enabled').prop('checked', true);
		$('#dialog-schedule-script option:first').prop('selected', true);
		setDateDisplay(new Date());
		$('#dialog-schedule-repeat').prop('checked', false);
		$('#dialog-schedule-repeat-every option[value="0"]').prop('selected', true);
		$('#dialog-schedule-remove-after-done').prop('checked', false);
		$('.p-dialog-schedule-repeat-every').hide();
		$('.p-dialog-schedule-repeat-value-dow').hide();
    $('#dialog-schedule-tags').tagsinput('removeAll');
    $('#dialog-schedule-repeat-value-dow-1').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-2').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-4').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-8').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-16').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-32').prop('checked', false);
    $('#dialog-schedule-repeat-value-dow-64').prop('checked', false);
	} else {
		var curDate = new Date(0);
		var curSchedule = globalSchedules[$schedule.attr('data-an-schedule-id')];
		$('#dialog-schedule-id').val(curSchedule.id);
		$('#dialog-schedule-name').val(curSchedule.name);
		$('#dialog-schedule-enabled').prop('checked', curSchedule.enabled);
		$('#dialog-schedule-remove-after-done').prop('checked', curSchedule.remove_after_done);
		$('#dialog-schedule-script option[value="'+curSchedule.script.id+'"]').prop('selected', true);
		$('#dialog-schedule-device option[value="'+curSchedule.device+'"]').prop('selected', true);
		curDate.setUTCSeconds(curSchedule.next_time);
		setDateDisplay(curDate);
		$('#dialog-schedule-repeat').prop('checked', curSchedule.repeat_schedule!=-1);
		$('#dialog-schedule-repeat-every option[value="'+curSchedule.repeat_schedule+'"]').prop('selected', true);
    $('#dialog-schedule-tags').tagsinput('removeAll');
    for (var key in curSchedule.tags) {
      $('#dialog-schedule-tags').tagsinput('add', curSchedule.tags[key]);
    }
		if (curSchedule.repeat_schedule == 3) {
			// Day of week
			$('#dialog-schedule-repeat-value-dow-1').prop('checked', (curSchedule.repeat_schedule_value & 1));
			$('#dialog-schedule-repeat-value-dow-2').prop('checked', (curSchedule.repeat_schedule_value & 2));
			$('#dialog-schedule-repeat-value-dow-4').prop('checked', (curSchedule.repeat_schedule_value & 4));
			$('#dialog-schedule-repeat-value-dow-8').prop('checked', (curSchedule.repeat_schedule_value & 8));
			$('#dialog-schedule-repeat-value-dow-16').prop('checked', (curSchedule.repeat_schedule_value & 16));
			$('#dialog-schedule-repeat-value-dow-32').prop('checked', (curSchedule.repeat_schedule_value & 32));
			$('#dialog-schedule-repeat-value-dow-64').prop('checked', (curSchedule.repeat_schedule_value & 64));
		} else {
			$('#dialog-schedule-repeat-value').val(curSchedule.repeat_schedule_value);
		}
		$('#dialog-schedule-repeat').trigger('change');
		$('#dialog-schedule-repeat-every').trigger('change');
	}
}

function setDateDisplay(curDate) {
	var hh = curDate.getHours();
	var mm = curDate.getMinutes();
	
	$('#dialog-schedule-date').val($.datepicker.formatDate('dd/mm/yy', curDate));
	$('#dialog-schedule-hh option[value='+hh+']').prop('selected', true);
	$('#dialog-schedule-mm option[value='+mm+']').prop('selected', true);
}

function okSchedule($dialog) {
	var postParams = {};
	var url = prefix;
	var isAdd = true;
	
	if ($dialog.find('#dialog-schedule-name').val() == '') {
		alert($.t('You must enter a name for the scheduled task'));
		return false;
	}
	
	if ($dialog.find('#dialog-schedule-id').val() != '') {
		url += '/SETSCHEDULE';
		postParams.id = $dialog.find('#dialog-schedule-id').val();
		isAdd = false;
	} else {
		url += '/ADDSCHEDULE';
	}
	postParams.name = $dialog.find('#dialog-schedule-name').val();
	postParams.enabled = $dialog.find('#dialog-schedule-enabled').prop('checked')?'true':'false';
	postParams.script = $dialog.find('#dialog-schedule-script').val();
	postParams.device = $dialog.find('#dialog-schedule-device').val();
  postParams.tags = $dialog.find('#dialog-schedule-tags').tagsinput('items').join();
	
	var now = new Date();
	var nextTime = $.datepicker.parseDate('dd/mm/yy', $dialog.find('#dialog-schedule-date').val());
	nextTime.setHours($dialog.find('#dialog-schedule-hh').val());
	nextTime.setMinutes($dialog.find('#dialog-schedule-mm').val());
	if (nextTime.getTime() < now.getTime() && !$dialog.find('#dialog-schedule-repeat').prop('checked')) {
		alert($.t('The next run must be in the future'));
		return false;
	}
  
  if ($dialog.find('#dialog-schedule-repeat').prop('checked')) {
    var repeatEvery = $dialog.find('#dialog-schedule-repeat-every').val();
    var repeatValue = $dialog.find('#dialog-schedule-repeat-value').val();
    if ((repeatEvery == 0 || repeatEvery == 1 || repeatEvery == 2 || repeatEvery == 4 || repeatEvery == 5) &&
    (repeatValue =='' || isNaN(repeatValue) || repeatValue <= 0)
    ) {
      alert($.t('You must enter a positive numeric value for the repeat frequency'));
      return false;
    }
  }
	postParams.next_time = nextTime.getTime() / 1000;
	postParams.remove_after_done = $dialog.find('#dialog-schedule-remove-after-done').prop('checked')?1:0;
	
	if ($dialog.find('#dialog-schedule-repeat').prop('checked')) {
		postParams.repeat_schedule = $dialog.find('#dialog-schedule-repeat-every').val();
		if (postParams.repeat_schedule == 3) {
			postParams.repeat_schedule_value = 0;
			for (var i=1; i<128; i *= 2) {
				postParams.repeat_schedule_value += $dialog.find('#dialog-schedule-repeat-value-dow-'+i).prop('checked')?i:0;
			}
		} else {
			postParams.repeat_schedule_value = $dialog.find('#dialog-schedule-repeat-value').val();
		}
	} else {
		postParams.repeat_schedule = -1;
	}
		
	var $posting = $.post(url, postParams);
	
	$posting.done(function(data) {
		var json = $.parseJSON(data);
		var schedule = json.schedule;
		globalSchedules[schedule.id] = schedule;
		if (isAdd) {
			var nextTime = new Date(schedule.next_time * 1000);
			var enabled = schedule.enabled;
			var htmlSchedule = '<p id="p-schedule-'+schedule.id+'" class="class-schedule class-schedule-'+schedule.id+'"><input type="button" data-an-schedule-id="'+schedule.id+'" class="admin-button admin-modify-delete" value="+" name="admin-schedule-'+schedule.id+'" id="admin-schedule-'+schedule.id+'"/><input type="checkbox" value="schedule-'+schedule.id+'" data-an-schedule="'+schedule.id+'" data-an-device="" name="schedule-'+schedule.id+'" id="schedule-'+schedule.id+'" /><label for="schedule-'+schedule.id+'" id="message-schedule-'+schedule.id+'"></label></p>\n';
			$('#schedule-global .inside').append(htmlSchedule);
			if (!enabled) {
				$('#message-schedule-'+schedule.id).text(schedule.name+' ('+$.t('Disabled')+')');
				$('#schedule-'+schedule.id).prop('checked', false);
			} else {
				$('#message-schedule-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
				$('#schedule-'+schedule.id).prop('checked', true);
			}
			if (adminGlobal) {
				$('#admin-schedule-'+schedule.id).show();
			}
			$('#schedule-'+schedule.id).change(function() {
				var value = $(this).prop('checked')?'1':'0';
				enableSchedule($(this), value);
			});
			if (schedule.device != "") {
				var htmlSchedule = '<p id="p-schedule-'+schedule.device+'-'+schedule.id+'" class="class-schedule class-schedule-'+schedule.id+'"><input type="button" data-an-schedule-id="'+schedule.id+'" class="admin-button admin-modify-delete" value="+" name="admin-schedule-'+schedule.device+'-'+schedule.id+'" id="admin-schedule-'+schedule.device+'-'+schedule.id+'"/><input type="checkbox" value="schedule-'+schedule.device+'-'+schedule.id+'" data-an-schedule="'+schedule.id+'" data-an-device="'+schedule.device+'" name="schedule-'+schedule.device+'-'+schedule.id+'" id="schedule-'+schedule.device+'-'+schedule.id+'" /><label for="schedule-'+schedule.device+'-'+schedule.id+'" id="message-schedule-'+schedule.device+'-'+schedule.id+'"></label></p>\n';
				$('#schedule-'+schedule.device+' .inside').append(htmlSchedule);
				if (!enabled) {
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+' ('+$.t('Disabled')+')');
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', false);
				} else {
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', true);
				}
				$('#schedule-'+schedule.device+'-'+schedule.id).change(function() {
					var value = $(this).prop('checked')?'1':'0';
					enableSchedule($(this), value);
				});
				if (devicesTab[schedule.device].admin) {
					$('#admin-schedule-'+schedule.device+'-'+schedule.id).show();
				}
				$('#admin-schedule-add-'+schedule.device).remove('click').click(function() {
					editSchedule(null);
				});
			}
		} else {
			$('.class-schedule-'+schedule.id).each(function() {
				$(this).find('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', schedule.enabled);
				if (!schedule.enabled) {
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+' ('+$.t('Disabled')+')');
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', false);
				} else {
					var nextTime = new Date(schedule.next_time * 1000);
					$('#message-schedule-'+schedule.device+'-'+schedule.id).text(schedule.name+', '+$.t('Next launch')+': '+nextTime.toLocaleString())
					$('#schedule-'+schedule.device+'-'+schedule.id).prop('checked', true);
				}
			});
		}
	});
	
	$dialog.dialog( 'close' );
}

function deleteSchedule($schedule) {
	var scheduleId = $schedule.attr('data-an-schedule-id');
	var url = prefix + '/DELETESCHEDULE/'+scheduleId;
	
	if (confirm($.t('Are you sure you want to delete this scheduled task ?'))) {
		var jqxhr = $.get( url, function(data) {
			var json = $.parseJSON(data);
			if (json.result == "ok") {
				$('.class-schedule-'+$schedule.attr('data-an-schedule-id')).each(function() {
					$(this).slideUp();
					$(this).remove();
				});
			}
		})
		.fail(function() {
			$('#footer-message-global').text($.t('Error deleting scheduled task'));
		});
	}
}

function initMusic(deviceId) {
	var url = 'mpc/control.php?device='+deviceId+'&servers';
	var jqxhr = $.get( url, function(data) {
		var json = $.parseJSON(data);
		globalMpd[deviceId] = json;
		for (var key in json) {
			var mpdName = json[key].name;
			var mpdDisplay = json[key].display;
			buildMusic(deviceId, mpdName, mpdDisplay);
		}
	})
	.fail(function() {
		$('#footer-message-global').text($.t('Error getting music device status'));
	});
}

function buildMusic(deviceId, mpdName, mpdDisplay) {
	var urlStatus = 'mpc/control.php?device='+deviceId+'&server='+mpdName+'&status';
	var jqxhr = $.get( urlStatus, function(data) {
		var music = $.parseJSON(data);
		var $mpc = $('#mpc-'+deviceId+' .inside');
		var htmlMpc = '<p><input type="button" name="toggle-mpc-'+deviceId+'-'+mpdName+'" id="toggle-mpc-'+deviceId+'-'+mpdName+'" value="' + $.t('Show') + '" data-i18n data-container="p-container-mpc-'+deviceId+'-'+mpdName+'" data-status="hidden" class="styled-button">&nbsp;'+mpdDisplay+'</p><div id="p-container-mpc-'+deviceId+'-'+mpdName+'"><p id="p-mpc-'+deviceId+'-'+mpdName+'" >\n';
		htmlMpc += '</p><p>';
		htmlMpc += '<div id="div-mpc-'+deviceId+'-'+mpdName+'-stop"><a href="#" id="mpc-'+deviceId+'-'+mpdName+'-stop" ><img src="images/media-playback-stop-big.png" /></a></div><div id="div-mpc-'+deviceId+'-'+mpdName+'-play"><a href="#" id="mpc-'+deviceId+'-'+mpdName+'-play"><img src="images/media-playback-start-big.png" /></a></div>\n';
		if (music.state == 'stopped') {
			htmlMpc += '<label id="label-mpc-'+deviceId+'-'+mpdName+'-status" class="music-title"></label>\n';
		} else {
			htmlMpc += '<label id="label-mpc-'+deviceId+'-'+mpdName+'-status" class="music-title">'+music.title+'</label>\n';
		}
		htmlMpc += '</p><p><label id="label-mpc-'+deviceId+'-'+mpdName+'" for="mpc-'+deviceId+'-'+mpdName+'">Volume: '+music.volume+' %</label><div id="label-mpc-slide-'+deviceId+'-'+mpdName+'"></div><div class="music" data-an-device="'+deviceId+'" data-an-mpc="'+mpdName+'" id="mpc-slide-'+deviceId+'-'+mpdName+'" ></div>\n';
		htmlMpc += '</p></p></div>\n';
		$mpc.append(htmlMpc);
		$('#p-container-mpc-'+deviceId+'-'+mpdName).hide();
		$('#toggle-mpc-'+deviceId+'-'+mpdName).click(function() {
			var $container = $('#'+$(this).attr('data-container'));
			if ($(this).attr('data-status') == 'hidden') {
				$container.slideDown();
				$(this).attr('value', $.t('Hide'));
				$(this).attr('data-status', 'shown');
				if (globalMpdIntervalHandle[deviceId] == undefined) {
					globalMpdIntervalHandle[deviceId] = [];
				}
				updateMusic(deviceId, mpdName);
				globalMpdIntervalHandle[deviceId][mpdName] = setInterval(function() {
					updateMusic(deviceId, mpdName);
				}, 1000 * 10);
		} else {
				$container.slideUp();
				$(this).attr('value', $.t('Show'));
				$(this).attr('data-status', 'hidden');
				if (globalMpdIntervalHandle[deviceId][mpdName] != undefined) {
					window.clearInterval(globalMpdIntervalHandle[deviceId][mpdName]);
				}
			}
		});
		if (music.state == 'playing') {
			$('#div-mpc-'+deviceId+'-'+mpdName+'-stop').show();
			$('#div-mpc-'+deviceId+'-'+mpdName+'-play').hide();
		} else {
			$('#div-mpc-'+deviceId+'-'+mpdName+'-stop').hide();
			$('#div-mpc-'+deviceId+'-'+mpdName+'-play').show();
		}
		$('#label-mpc-slide-'+deviceId+'-'+mpdName).html(music.volume+' %');
		$(function() {
			$('#label-mpc-slide-'+deviceId+'-'+mpdName).empty().slider({
				min:0,
				max:100,
				step:1,
				value:music.volume,
				change:function( event, ui ) {
					if (event.originalEvent) {
						var url = 'mpc/control.php?device='+deviceId+'&server='+mpdName+'&volume='+$(this).slider( 'value' );
						var jqxhr = $.get( url, function(data) {
							var json = $.parseJSON(data);
							updateMusic(deviceId, mpdName);
						})
						.fail(function() {
							$('#message-'+deviceId).text($.t('Error setting music'));
						});
					}
				}
			});
		});
		
		$('#mpc-'+deviceId+'-'+mpdName+'-stop').click(function() {
			var url = 'mpc/control.php?device='+deviceId+'&server='+mpdName+'&stop';
			var jqxhr = $.get( url, function(data) {
				var json = $.parseJSON(data);
				updateMusic(deviceId, mpdName);
			})
			.fail(function() {
				$('#message-'+deviceId).text($.t('Error setting music'));
			});
			return false;
		});
		
		$('#mpc-'+deviceId+'-'+mpdName+'-play').click(function() {
			var url = 'mpc/control.php?device='+deviceId+'&server='+mpdName+'&play';
			var jqxhr = $.get( url, function(data) {
				updateMusic(deviceId, mpdName);
			})
			.fail(function() {
				$('#message-'+deviceId).text($.t('Error setting music'));
			});
			return false;
		});
		
		$('#label-mpc-'+deviceId+'-'+mpdName+'-status').click(function() {
			updateMusic(deviceId, mpdName);
		});
	})
	.fail(function() {
		$('#footer-message-global').text($.t('Error setting music')+', '+$.t('network error'));
	});
}

function updateMusic(deviceId, mpdName) {
	var urlStatus = 'mpc/control.php?device='+deviceId+'&server='+mpdName+'&status';
	var jqxhr = $.get( urlStatus, function(data) {
		var music = $.parseJSON(data);
		$('#label-mpc-'+deviceId+'-'+mpdName).html($.t('Volume')+': '+music.volume+' %');
		$('#label-mpc-'+deviceId+'-'+mpdName+'-status').html(music.title);
		$('#label-mpc-slide-'+deviceId+'-'+mpdName).slider('value', music.volume);
		if (music.state == 'playing') {
			$('#div-mpc-'+deviceId+'-'+mpdName+'-stop').slideDown();
			$('#div-mpc-'+deviceId+'-'+mpdName+'-play').slideUp();
		} else {
			$('#div-mpc-'+deviceId+'-'+mpdName+'-stop').slideUp();
			$('#div-mpc-'+deviceId+'-'+mpdName+'-play').slideDown();
		}
	})
	.fail(function() {
		$('#footer-message-global').text($.t('Error setting music')+', '+$.t('network error'));
	});
}

function initCameras() {
	var urlCameras = 'camera/listfiles.php';
	var jqxhr = $.get( urlCameras, function(data) {
		var cameras = $.parseJSON(data);
		for (i in cameras.cameras) {
			var camera = cameras.cameras[i];
			globalCameras[camera.name] = [];
			globalCameras[camera.name]['selected'] = 'lastsnap.jpg';
			getCameraFiles(camera.name, false);
			getCameraFiles(camera.name, true);
			var divCamera = $('#div-camera').html().replace(/CAMERA/g, camera.name).replace(/DESCRIPTION/g, camera.description);
			$('#list-cameras').append(divCamera);
			$('input[name=camera-switch-'+camera.name+']').change(function() {
				triggerImagesListChange($(this).attr('name').split('-').slice(-1).pop());
				$('#camera-list-'+camera.name).trigger('change');
			});
			
			$('#camera-list-'+camera.name).change(function() {
				var cameraName = $(this).attr('name').split('-').slice(-1).pop();
				if (!$('#camera-switch-'+cameraName+'-stream').prop('checked')) {
					var url = 'camera/camera.php?camera='+cameraName+'&file='+$(this).val()+'&random='+Math.floor((Math.random()*100)+1);
					if ($('#camera-switch-'+cameraName+'-trigg').prop('checked')) {
						url += '&alert';
					}
					$('#camera-photo-'+cameraName).attr('src', url);
					$('#camera-photo-large-'+cameraName).attr('href', url+'&large');
				}
			});
		}
	})
	.fail(function() {
		$('#footer-message-global').text($.t('Error getting cameras')+', '+$.t('network error'));
	});
}

function getCameraFiles(camera, alert) {
	var url = 'camera/listfiles.php?camera='+camera;
	var type = (alert?'alert':'sched');
	url += (alert?'&alert':'');
	
	var jqxhr = $.get( url, function(data) {
		var listFiles = $.parseJSON(data);
		if (listFiles.result == 'ok') {
			globalCameras[camera][type] = listFiles.list;
			triggerImagesListChange(camera);
		} else {
			$('#footer-message-global').text($.t('Error getting camera '+camera)+', '+$.t('server error'));
		}
	})
	.fail(function() {
		$('#footer-message-global').text($.t('Error getting camera '+camera)+', '+$.t('network error'));
	});
}

function triggerImagesListChange(camera) {
	var $selectList = $('#camera-list-'+camera);
	var selected = '';
	if ($('#camera-switch-'+camera+'-sched').prop('checked')) {
		$selectList.empty();
		$selectList.append('<option value="lastsnap.jpg">'+$.t('Last snapshot')+'</option>\n');
		for (index in globalCameras[camera]['sched']) {
			if (globalCameras[camera]['sched'][index] == globalCameras[camera]['selected']) {
				selected = ' selected="true"';
			} else {
				selected = '';
			}
			$selectList.append('<option value="'+globalCameras[camera]['sched'][index]+'"'+selected+'>'+globalCameras[camera]['sched'][index]+'</option>\n');
		}
	} else if ($('#camera-switch-'+camera+'-trigg').prop('checked')) {
		$selectList.empty();
		for (index in globalCameras[camera]['alert']) {
			if (globalCameras[camera]['alert'][index] == globalCameras[camera]['selected']) {
				selected = ' selected="true"';
			} else {
				selected = '';
			}
			$selectList.append('<option value="'+globalCameras[camera]['alert'][index]+'"'+selected+'>'+globalCameras[camera]['alert'][index]+'</option>\n');
		}
	} else if ($('#camera-switch-'+camera+'-stream').prop('checked')) {
		$selectList.empty();
		$selectList.append('<option data-i18n>'+$.t('Real-time stream')+'</option>\n');
		var url = 'camera/stream.php?camera='+camera;
		$('#camera-photo-'+camera).attr('src', url);
		$('#camera-photo-large-'+camera).attr('href', url+'&large');
	}
	$selectList.trigger('change');
}

function updateRadioSongList() {
	url = 'liquidsoap/?stream='+globalCurrentRadioStream+'&action=on_air';
	var jqxhr = $.get(url, function(data) {
		globalCurrentSong = $.parseJSON(data);
		var $select = $('#radio-list-song');
		
		url = 'liquidsoap/?stream='+globalCurrentRadioStream+'&action=list';
		var jqxhr = $.get(url, function(data) {
			var list = $.parseJSON(data);
			globalRadioSongsList = list;
			var selectedSong = $select.find('option:selected').text();
			$select.empty();
			$select.append('<option value="current">'+$.t('Current song')+'</option>');
			if (list.length >0) {
				for (i=0; i<list.length; i++) {
					$select.append('<option value="'+i+'">'+list[i].artist + ' - ' + list[i].title+'</option>');
				}
				if (selectedSong != '') {
					$select.find('option:contains('+selectedSong+')').prop('selected', true);
				}
			}
			$select.unbind('change').change(function() {
				if ($(this).val() == 'current') {
					updateRadioSongMetadata(globalCurrentSong);
				} else {
					updateRadioSongMetadata(globalRadioSongsList[$(this).val()]);
				}
			});
			$select.trigger('change');
		});
		updateRadioCommands();

		$('#a-radio-command-start').unbind('click').click(function() {
			sendRadioCommand('start');
			return false;
		});

		$('#a-radio-command-stop').unbind('click').click(function() {
			sendRadioCommand('stop');
			return false;
		});

		$('#a-radio-command-next').unbind('click').click(function() {
			sendRadioCommand('skip');
			return false;
		});
	});
}

function sendRadioCommand(command) {
	url = 'liquidsoap/?stream='+globalCurrentRadioStream+'&action=request&command='+command;
	var jqxhr = $.get(url, function(data) {
		var response = $.parseJSON(data);
		if (response.response == 'OK') {
			updateRadioCommands();
		}
	});
}

function updateRadioCommands() {
	url = 'liquidsoap/?stream='+globalCurrentRadioStream+'&&action=request&command=status';
	var jqxhr = $.get(url, function(data) {
		var response = $.parseJSON(data);
		if (response.response == 'on') {
			var $pRadioCommands = $('#p-radio-commands');
			$('#a-radio-command-start').hide();
			$('#a-radio-command-stop').show();
			$('#a-radio-command-next').show();
		} else {
			$('#a-radio-command-start').show();
			$('#a-radio-command-stop').hide();
			$('#a-radio-command-next').hide();
		}
	});
}

function updateRadioSongMetadata(song) {
	$('#radio-metadata-song-title').text(song.title);
	$('#radio-metadata-song-artist').text(song.artist);
	if (song.albumartist === undefined) {
		$('#radio-metadata-song-albumartist').text('');
	} else {
		$('#radio-metadata-song-albumartist').text(song.albumartist);
	}
	$('#radio-metadata-song-album').text(song.album);
	$('#radio-metadata-song-year').text(song.year);
}

function toggleRadio(state) {
	if (state === false) {
		toggleRadioData(false);
		$('#radio-stream').trigger('pause');
		$('#radio-stream').empty();
		$('#radio-toggle').attr('value', $.t('Show'));
		$('#p-radio-list').slideUp();
		$('#p-radio-stream').slideUp();
		$('#p-radio-commands').slideUp();
		$('#inner-radio-data').slideUp();
		globalRadioToggle = false;
	} else {
		$('#radio-toggle').attr('value', $.t('Hide'));
		$('#p-radio-list').slideDown();
		$('#p-radio-stream').slideDown();
		$('#p-radio-commands').slideDown();
		$('#inner-radio-data').slideDown();
		globalRadioToggle = true;
		
		var url = 'liquidsoap/?action=streams';
		var jqxhr = $.get(url, function(data) {
			globalRadioSources = $.parseJSON(data);
			
			var $radioList = $('#radio-list');
			$radioList.empty();
			for (streamId in globalRadioSources) {
				var option = '<option value="' + streamId + '">' + globalRadioSources[streamId].name + '</option>\n';
				$radioList.append(option);
			}
			globalCurrentRadioStream = $radioList.val();
      $('#radio-list').trigger('change');
		});
	}
}

function toggleRadioData(state) {
	if (state === false) {
		$('#radio-data-toggle').attr('value', $.t('Show'));
		$('#p-radio-list-songs').slideUp();
		$('#p-radio-metadata-song').slideUp();
		globalRadioDataToggle = false;
		if (globalRadioIntervalHandle !== '') {
			window.clearInterval(globalRadioIntervalHandle);
			globalRadioIntervalHandle = '';
		}
	} else {
		$('#radio-data-toggle').attr('value', $.t('Hide'));
		$('#p-radio-list-songs').slideDown();
		$('#p-radio-metadata-song').slideDown();
		globalRadioDataToggle = true;
		
		updateRadioSongList();
		globalRadioIntervalHandle = setInterval(function() {
			updateRadioSongList();
		}, 1000*10); 

	}
}

function changeRadioSource(sourceId) {
	if (globalRadioSources[sourceId] !== undefined) {
		var random = Math.floor(Math.random() * 100);
		source = '<source id="radio-stream-source-' + sourceId + '" src="' + globalRadioSources[sourceId].url + '?rnd=' + random + '" type="' + globalRadioSources[sourceId].type + '" />';
		$('#radio-stream').empty();
		$('#radio-stream').append(source);
		$('#radio-stream').append('<em>Sorry, your browser doesn\'t support HTML5 audio.</em>');
		$('#radio-stream').load()
		globalCurrentRadioStream = sourceId;
		$('#radio-list-song').empty();
		updateRadioSongList();
	} else {
		globalCurrentRadioStream = '';
		$('#radio-stream').empty();
		$('#radio-stream').append('<em>Sorry, no source or source invalid.</em>');
		$('#radio-stream').load()
		$('#radio-list-song').empty();
	}
}

function toggleRestart() {
  if (globalRestart) {
    globalRestart = false;
    $('#p-restart-confirm').slideDown();
    $('#p-restart-launch').slideUp();
  } else {
    globalRestart = true;
    $('#p-restart-confirm').slideUp();
    $('#p-restart-launch').slideDown();
  }
}

function restartServer() {
  toggleRestart();
  
  $message = $('#header-message-restart');
  var url = prefix+'/RESTARTSERVER/';
  var jqxhr = $.get(url, function(data) {
    restart = $.parseJSON(data);
    
    if (restart.result == 'error') {
      $message.text($.t('Error restarting server'));
    } else {
      $message.text($.t('Server restart in progress, this might take a while'));
    }
    setTimeout(function() {
      $message.text('');
    }, 10000);
  })
  .fail(function() {
    $message.text($.t('Server restart in progress, this might take a while'));
    setTimeout(function() {
      $message.text('');
    }, 10000);
  });
}
