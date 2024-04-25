/*
*  Media Liberary API
**/

var Media_photos={};	
var Media=new MediaLiberary();

function hasJsonStructure(str) {
    if (typeof str !== 'string' || str=="" || str.length==0) return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === '[object Object]' 
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
}
/*
*  installin Media Liberary
**/
function MediaLiberary(){
	//console.log("starting Media Liberary");
	this.setting={
		defaultes:{
			"use"                : "إستخدام",
			"close"              : "إلغاء",
			"title"              : "أختيار ملف",
			"modal_id"           : "Media-Modal",
			"tab_content_trget"  : ".modal-body",
			"file_panel"         : {
				"side_id":"media-panel-side",
				"list_id":"media-panel-list",
				"item_key":"media-item",
				"delete_id":"delete-selected-item",
			},
			"upload_obj"         : false,
			"trigger"            : "*[media]",
			"triggers"           : {
				//"selector":{selector options}
			}
		},
		allowed_files:{
			//"favicon"   :{"title":"الصور","type":"image","ext":"png"},
			"photo"     :{"title":"الصور","type":"image","ext":"jpeg|jpg|png|gif|bmp"},
			"video"     :{"title":"الفيديو","type":"video","ext":"swf|avi|mp4|mov|mpg"},
			"audio"     :{"title":"الصوتيات","type":"audio","ext":"mp3|wav"},
			"documents" :{"title":"المستندات","type":"text","ext":"docx|doc|pdf|xls|xlsx"},
			"archive"   :{"title":"ملفات مضغوطة","type":"archive","ext":"zip|zipx|rar|7z|s7z"},
		},
		display_files:{},
		selected:{},
		current_ids:{},
		current_status:false,
		current_target:false,
		file_type:"photo",
		media_object:false,
		upload_obj:false,
		upload_status:false,
		upload_error:{},
		upload_files:{accepted:{},ignore:{},not_allowed:{}},
		
	};

	this.uploading_count=0;
	this.valid_ext={};
	this.multi=false;
	this.files={};
	this.file_relation={};
	this.selected=0;
	this.tabs_loaded={};
	this.LoadedData=false;
	this.LoadedDataPage={
		"photo"     :0,
		"video"     :0,
		"audio"   :0,
		"documents" :0,
		"archive"   :0,
	};
	this.button=false;
	this.Modal=false;
	///////
	/*
	*  Media Liberary Events
	**/
	var _triggers = {};
  
	this.on = function(event,callback) {
		if(!_triggers[event])
			_triggers[event] = [];
		_triggers[event].push( callback );
	  }
  
	this.triggerHandler = function(event,params) {
		if( _triggers[event] ) {
			for( i in _triggers[event] )
				_triggers[event][i](params);
		}
	}
	///////
}

/*
*  create_uniq_id
**/
function create_uniq_id(current_ids){
	
	var d = new Date().valueOf();
	var n = d.toString();
	var result = 'PVSC';
	var length = 15;
	var p = 0;
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	
	for (var i = length; i > 0; --i){
		result += ((i & 1) && n.charAt(p) ? n.charAt(p) : chars[Math.floor(Math.random() * chars.length)]);
		if(i & 1) p++;
	};
	if( typeof(current_ids) =='object' && current_ids.hasOwnProperty(result)){
		return create_uniq_id(current_ids);
	}
	return result;

}

/*
*  installin Media Liberary
**/
Media.install=function($options){
	//console.log("installing Media Liberary");
	$.each(Media.setting.allowed_files,function(file_type,data){
			Media.valid_ext[file_type]=data["ext"].split("|");
	});
	//console.log("---- valid_ext ----");
	//console.log(Media.valid_ext);
	// Modal EVENTS
	
	/*
	// trigger EVENTS
	$("body").find(Media.setting.defaultes.trigger).each(function(index){
			
			var btn_uniq_id=create_uniq_id(Media.setting.current_ids);
			//console.log("item uniq_id: "+ btn_uniq_id);
			var $item_types=$(this).attr("media");
			//console.log("item:$item_types");
			//console.log($item_types);
			
			Media.setting.defaultes.triggers[btn_uniq_id]={
				"title":function(){
					var $title=$(this).attr("media-title");
					////////////////////////////////////////////////////
					if($title){
						$title=$title.trim();
					}
					if(!$title){
						$title=Media.setting.defaultes.title;
					};
					return $title;
				},
				"":{},
			};
			$(this).on("click",function(e){
				if(Media.setting.current_status){
					e.preventDefault();
					return false;
				}
				Media.Show($(this));
			});
			
			//Media.setting.defaultes.triggers[index]=$(this);
			//Media.button_event();
	});
	*/
	Media.triggerHandler('installed');
}

/*
*  Show Media Liberary
**/
Media.button=function($selector,$file_type,options){
	this.selector_btn=$($selector);
	this.Max=false;
	this.MaxMsg="";
	this.multi=(!options["multi"])?false:true;
	this.delete_btn=(options["delete_btn"] && $(options["delete_btn"]).length > 0 )? $(options["delete_btn"]):false;
	this.selected={};
	this.selected_id=( typeof(options)== "object" && options.hasOwnProperty("selected") && $(options["selected"]).val()>0)?$(options["selected"]).val():false;
			//"media-thumb": <?=$media_thumb?>,
			//"media-preview": <?=$thumb_preview?>,
			//"crop":false,
	this.thumb={
		thumb:options["media-thumb"],
		preview:options["media-preview"],
		crop:options["crop"],
	};
	this.crop=this.thumb.crop;
	this.CropManager=false;
	if(this.thumb.crop && typeof this.CropManager){
		//this.CropManager= this.thumb.crop;
	}
	Media.selected=this.selected;
	Media.allowScroll=false;
	this.selected_type="";
	var file_type=[];
	if(typeof($file_type) == "object" && $file_type.length > 0){
		$.each($file_type,function(k,v){
			if(Media.setting.allowed_files.hasOwnProperty(v)){
				file_type.push(v);
				Media.files[v]={};
				Media.file_relation[v]={};
			}
		});
		
	}else if( $file_type && $file_type.length> 0){
		if(Media.setting.allowed_files.hasOwnProperty($file_type)){
			file_type.push($file_type);
			Media.files[$file_type]={};
			Media.file_relation[$file_type]={};
		}
	}else{
		return false;
	}
	if( file_type.length < 1){
		return false;
	}
	this.file_type=file_type;
	//console.log("--- button file type---");
	//console.log(this.file_type);
	///////
	/*
	*  button Events
	**/
	var _triggers = {};
  
	this.on = function(event,callback) {
		if(!_triggers[event])
			_triggers[event] = [];
		_triggers[event].push( callback );
	  }
  
	this.triggerHandler = function(event,params) {
		if( _triggers[event] ) {
			for( i in _triggers[event] )
				_triggers[event][i](params);
		}
	}
	///////
	var $media_object = this;
	//alert($media_object);
	////////////////////////////////
	if(this.selected_id){
		Media._get(this.selected_id,$media_object);
	}
	////////////////////////////////
	if(this.selected_id && $media_object.delete_btn){
		if( Media.selected < 1){
			$media_object.delete_btn.hide(0);
		}else{
			$media_object.delete_btn.show(0);
		}
		////////////////////////////////
		//allowed_files
	}else if($media_object.delete_btn){
		$media_object.delete_btn.hide(0);
	}
	if($media_object.delete_btn){
		$media_object.delete_btn.on("click",function(){
			//console.log("------media empty btn-------");
			Media.triggerHandler("empty",$media_object);
			$media_object.delete_btn.hide(0);
		});
	}
	////////////////////////////////
	//allowed_files
	$($selector).on("click",function(){
		if($media_object.Max){
			alert($media_object.MaxMsg);
			return false;
		}
		Media.setting.media_object=$media_object;
		Media.setting.file_type=$media_object.file_type;
		if(Media.selected!=$media_object.selected_id){
			Media.selected=0;
		}
		Media.Show(options);
		if( typeof(options)== "object" && options.hasOwnProperty("multi")){
			Media.multi=$media_object.multi;
		}
	});




}

Media._get=function(file_id,$media_object){

	//Media._get(options["selected"]);
	//Media.setting.media_object.selected=Media.files[Media.setting.defaultes.current_tab][Media.selected];
	//$('#'+Media.setting.defaultes.modal_id).modal('hide');
	//Media.setting.media_object.triggerHandler("selected");

	var path =$ajax_path+"?action=get-attachment";
	var xhr = new XMLHttpRequest(); 
	//var formData = new FormData($("#fileup-form-test"));
	var formData = new FormData();
	formData.append('id', file_id);
	// load
	xhr.addEventListener("load"     ,  function(evt){
		//console.log(evt.currentTarget.response);
		var response= JSON.parse(evt.currentTarget.response);
		//console.log(response);
		if(typeof response === "object" ){
			if(response.hasOwnProperty("success")){
				//console.log("-- _get attachment result --");
				//console.log(response.data);
				var file=response.data;
				Media.selected=file.id;
				$media_object.selected_id=file.id;
				$media_object.selected=file;
				$media_object.selected_type=file.type;
				$media_object.triggerHandler("selected");

				if($media_object.delete_btn){
					$media_object.delete_btn.show(0);
				}
				//Media.LoadedData=response.data.result;
			}else{
				alert(response.error);
			}
		}else{
			alert(evt.currentTarget.response);
		}
		
	},false);
	// error
	xhr.addEventListener("error"    ,  function(evt){
		alert("error getting attachment id ");
	},false);
	// abort
	xhr.addEventListener("abort"    ,  function(evt){
		alert("abort getting attachment id ");
	},false);
	
	xhr.open( "POST", path , true );
 	xhr.send(formData);
}



Media.on("empty",function($media_object){
	//console.log("------media empty event-------");
	//console.log(Media);
	//console.log(Media.setting.media_object);
	//console.log("------media_object-------");
	//console.log($media_object);
	//Media.setting.media_object.triggerHandler("empty");
	//Media.setting.media_object.selected_id=false;
	$media_object.triggerHandler("empty");
	$media_object.selected_id=false;
	//Media.setting.media_object.selected_type=Media.setting.defaultes.current_tab;
	Media.setting.media_object.selected={};
});

/*
*  Show Media Liberary
**/
Media.Show=function(options){
	//console.log("Showing Media Liberary");
	var $title="";
	if( typeof(options)== "object" && options.hasOwnProperty("title")){
		$title=options["title"];
	}else{
		$title=Media.setting.defaultes.title;
	}
	file_type=Media.setting.file_type;
	////////////////////////////////////////////////////
	var tabs='<ul class="nav nav-tabs" id="modal-tabs">';
	$.each(file_type,function(k,type){
		tabs+='<li><a href="#" data-type="'+type+'">'+Media.setting.allowed_files[type]["title"]+'</a></li>';
	});
	tabs+='<li><a href="#" data-type="upload" >رفع ملف</a></li>';
		tabs+='</ul>';
	////////////////////////////////////////////////////
	////////////////////////////////////////////////////
	$("body").append('<div id="'+Media.setting.defaultes.modal_id+'" class="modal media-modal fade" role="dialog"><div class="modal-dialog  modal-lg"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">'+$title+'</h4>'+tabs+'</div><div class="modal-body"></div><div class="modal-footer"><span class="btn btn-warning" id="useit">'+Media.setting.defaultes.use+'</span><button type="button" class="btn btn-default" data-dismiss="modal" id="dismiss">'+Media.setting.defaultes.close+'</button></div></div></div></div>');
	////////////////////////////////////////////////////
	Media.Modal = $('body #'+Media.setting.defaultes.modal_id);
	////////////////////////////////////////////////////
	//Media.setting.current_target=$target;
	Media.Modal.on('shown.bs.modal', function (event) {
		//alert("showen.bs.modal");
		Media.setting.current_status="open";
		Media.triggerHandler('showen');
		////////////////////////////////////////////////////
		var tab="upload";
		if( Media.setting.media_object.selected_id ){
			Media.selected=Media.setting.media_object.selected_id;
			tab=Media.setting.media_object.selected_type;
		}
		////////////////////////////////////////////////////
		Media.LoadTab(tab);
		////////////////////////////////////////////////////
		$('#modal-tabs li:not(.desable)').find("a").on("click",function(e){
			//////////////////////
			var content_type=$(this).attr("data-type");
			current_tab=Media.setting.defaultes.current_tab;
			//////////////////////
			if( current_tab == content_type)
				return false;
			//////////////////////
			Media.LoadTab(content_type);
			//////////////////////
			return false;
		});
		////////////////////////////////////////////////////
	});
	////////////////////////////////////////////////////
	Media.Modal.on('hidden.bs.modal', function (event) {
		Media.setting.current_status=false;
		Media.triggerHandler('hidden');
		$('#'+Media.setting.defaultes.modal_id).html("").remove();
	});
	////////////////////////////////////////////////////
	Media.Modal.find("#useit:not(.desable)").on("click",function(e){
		if(Media.selected > 0 && Media.files[Media.setting.defaultes.current_tab].hasOwnProperty(Media.selected)){
			Media.setting.media_object.selected_id=Media.selected;
			Media.setting.media_object.selected_type=Media.setting.defaultes.current_tab;
			Media.setting.media_object.selected=Media.files[Media.setting.defaultes.current_tab][Media.selected];
			$('#'+Media.setting.defaultes.modal_id).modal('hide');
			Media.setting.media_object.triggerHandler("selected");
			if(Media.setting.media_object.delete_btn){
				Media.setting.media_object.delete_btn.show(0);
			}
		}else{
			if(Media.setting.media_object.delete_btn){
				Media.setting.media_object.delete_btn.hide(0);
			}
		}
	});
	////////////////////////////////////////////////////
	Media.Modal.modal({backdrop:"static"});
	////////////////////////////////////////////////////
	/*
	$('#'+Media.setting.defaultes.modal_id+" .modal-footer #useit:not(.desable)").on("click",function(e){
		alert("use selected");
		Media.button.selected=Media.files[Media.setting.defaultes.current_tab][Media.selected];
		Media.button.triggerHandler("selected");
		$('#'+Media.setting.defaultes.modal_id).modal({show:false});
		console.log("--- used file ---");
		console.log(Media.button.selected);
	});
	*/
	////////////////////////////////////////////////////
};


Media.LoadTab=function(tab_type,upload_redirect){
	if(Media.uploading_count>0){
		return false;
	}
	Media.setting.defaultes.current_tab=tab_type;
	$('#modal-tabs').find("li.active").removeClass("active");
	$('#modal-tabs a[data-type="'+tab_type+'"]').parent().addClass("active");
	//////////////////////////////
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	tab_content_target.html("Tab "+ tab_type);
	// call tab contents
	//if(!upload_redirect){
		Media.tabs();
	//}
	//var active = (k==0)?'class="active"':'';
	
	/**/
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	var tab_type=Media.setting.defaultes.current_tab;
	var panel_ids=Media.setting.defaultes.file_panel;
	var content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget+" #"+panel_ids["list_id"]);
	content_target.scroll(function(e) {
		//console.log("cxcxccxc");
		var def_top=content_target.children(".list").outerHeight() - content_target.height();
		var LoadMore=( def_top == content_target.scrollTop() )?true:false;
		if( Media.allowScroll && LoadMore ){
			//Loader.Ajax("scroll");
			//Media.allowScroll=
			//console.log("scroll action");
			//console.log("scroll action");
			//console.log(Media);
			Media.load_contents(true);
			
		}
	});
	/**/
}

Media.on("loadingEnd",function(){
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	tab_content_target.find("#loading").remove();
});

Media.on("ContentLoaded",function(){
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	var tab_type=Media.setting.defaultes.current_tab;
	//tab_content_target.find("#loading").remove();
	if(!Media.LoadedData || typeof Media.LoadedData != "object" ){
		return false;
	}
	$.each(Media.LoadedData,function(file_id,file_data){
		Media.append(file_data);
	});
	
	Media.LoadedData=false;
	
	if(!Media.LoadedDataPage[tab_type]){
		Media.tabs_loaded[tab_type]=true;
	}
	//console.log("Media After New Data");	
	//console.log(Media);	
	//alert("content loaded");
});

Media.on("Scroll",function(stat){
	if(!stat){
		Media.allowScroll=false;
		return false;
	}
	Media.allowScroll=true;
	//console.log("------Media-------");
	//console.log(Media);
});
Media.append=function(file_data,new_up_file){
	var file_id=file_data.id;
	Media.files[file_data.type][file_id]=file_data; 
	if(!new_up_file){
		Media.file_relation[file_data.type][file_data.relation]=parseInt(file_id);
	}
	var panel_ids=Media.setting.defaultes.file_panel;
	var content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget+" #"+panel_ids["list_id"]);
	if( Media.setting.defaultes.current_tab == file_data.type ){
		Media.display_item(content_target,file_data);
	}
	//console.log("---- Media files ----");
	//console.log(Media.files);
	
};
Media.display_item=function(content_target,file_data){
	//console.log("content_target");
	//console.log(content_target);
	//console.log("file_data");
	//console.log(file_data);
	//console.log("Media.media_object");
	//console.log(Media);
	var item_code="";
	var item_type=file_data.type;
	if(file_data.type == "photo"){
		item_code +='<img src="'+file_data.thumb.media+'" />';
	}else{
		item_code +='<div class="file"><div type="'+item_type+'" icon="'+file_data.ext+'" class="m-icon" ></div>'+file_data.name+'</div>';
	}
	var $item=$('<li class="media-item" id="media-item" media-id="'+file_data.id+'" media-type="'+file_data.type+'"><div class="check"></div>'+item_code+'</li>');
	$item.appendTo(content_target.children(".list"));
	
	if(Media.selected == file_data.id){
		$item.addClass("selected");
		Media.select_file(file_data.id);
		//alert(Media.selected);
	}
	
	$item.on("click",function(e){
		//alert("clicked");
		if(Media.selected == file_data.id ){
			$(this).removeClass("selected");
			var panel_ids=Media.setting.defaultes.file_panel;
			var item_container=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget+" #"+panel_ids["side_id"]).find(".selected-file-info[media-id="+file_data.id+"]");
			item_container.html("").remove();
			Media.selected = 0;
			Media.desable_use();
			return false;
		}
		content_target.find(".selected").removeClass("selected");
		Media.select_file(file_data.id);
		$(this).addClass("selected");
	});
}

Media.display_content=function(){
	var panel_ids=Media.setting.defaultes.file_panel;
	var content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget+" #"+panel_ids["list_id"]);
	tab_type=Media.setting.defaultes.current_tab;
	/////////////////////////////////////////////
	if(typeof Media.files[tab_type] != "object" )
		return false;
	/////////////////////////////////////////////
	//console.log("before display: "+tab_type);
	//$.each(Media.files[tab_type],function(file_id,file_data){
	//console.log(Media);
	//return false;
	$.each(Media.file_relation[tab_type],function(file_key,file_id){
		var file_data = Media.files[tab_type][file_id];
		Media.display_item(content_target,file_data);
	});
	//Media.allowScroll=true;	
	//return false;
};

Media.load_contents=function(is_scroll){
	/////////////////////////////////////////////////
	tab_type=Media.setting.defaultes.current_tab;
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	var footer=$('#'+Media.setting.defaultes.modal_id+" .modal-footer");
	var panel_ids=Media.setting.defaultes.file_panel;
	/////////////////////////////////////////////////
	if(Media.tabs_loaded.hasOwnProperty(tab_type)){
		return false;
	}
	Media.allowScroll=false;
	/////////////////////////////////////////////////
	var loel=$('<div class="loading" id="loading"></div>');
	loel.appendTo(tab_content_target);
	if(is_scroll){
		loel.addClass("Scroll-Loading").text('جارى التحميل');
		//return false;
	}
	
	
	//Media.triggerHandler('loadingEnd');
	//Media.triggerHandler('ContentLoaded');
	//return false;
	
	var path =$ajax_path+"?action=get-media-files";
	var xhr = new XMLHttpRequest(); 
	//var formData = new FormData($("#fileup-form-test"));
	var formData = new FormData();
	formData.append('pv_type', tab_type);
	formData.append('page', Media.LoadedDataPage[tab_type]);
	// load


	xhr.addEventListener("load"     ,  function(evt){
		Media.triggerHandler('loadingEnd');

		//console.log("-- content load currentTarget --");
		var Evt_Response =evt.currentTarget.response;
		//console.log(Evt_Response);
		if(Evt_Response=="" || !hasJsonStructure(Evt_Response)){
			var response= Evt_Response;
		}else{
			var response= JSON.parse(Evt_Response);
		}
		console.log("-- Media-Liberary content load response --");
		console.log(response);
		if(typeof response === "object" ){
			if(response.data.code==200){
				//console.log("-- content load result --");
				//console.log(response.data.result);
				Media.LoadedData=response.data.result;
				if(!response.data.nextpage){
					Media.LoadedDataPage[tab_type]=false;
					Media.triggerHandler("Scroll",false);
				}else{
					//Media.LoadedDataPage[tab_type]=response.data.nextpage;
					//Media.LoadedDataPage[tab_type]=response.data.nextpage;
					Media.LoadedDataPage[tab_type]++;
					Media.triggerHandler("Scroll",true);
				}
				Media.triggerHandler('ContentLoaded');
			}else{
				Media.LoadedData=false;
				Media.LoadedDataPage[tab_type]=false;
				Media.triggerHandler("Scroll",false);
				alert(response.data.result);
			}
		}else{
			Media.LoadedData=false;
			Media.LoadedDataPage[tab_type]=false;
			Media.triggerHandler("Scroll",false);
			alert(evt.currentTarget.response);
		}
		
	},false);
	// error
	xhr.addEventListener("error"    ,  function(evt){
		Media.triggerHandler('loadingEnd');
		Media.LoadedData=false;
		alert("error listing content data ");
	},false);
	// abort
	xhr.addEventListener("abort"    ,  function(evt){
		Media.triggerHandler('loadingEnd');
		Media.LoadedData=false;
		alert("abort listing content data ");
	},false);
	
	xhr.open( "POST", path , true );
 	xhr.send(formData);
};


Media.tabs=function(){
	if(Media.uploading_count>0){
		return false;
	}
	//////////////////////////////
	tab_type=Media.setting.defaultes.current_tab;
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	var panel_ids=Media.setting.defaultes.file_panel;
	//////////////////////////////
	//////////////////////////////
	switch(tab_type){
		case "photo":
			Media.file_panel(tab_type,tab_content_target);
		break;
		//////////////////////
		case "video":
			Media.file_panel(tab_type,tab_content_target);
		break;
		//////////////////////
		case "audio":
			Media.file_panel(tab_type,tab_content_target);
		break;
		//////////////////////
		case "documents":
			Media.file_panel(tab_type,tab_content_target);
		break;
		//////////////////////
		case "archive":
			Media.file_panel(tab_type,tab_content_target);
		break;
		//////////////////////
		case "upload":
		default:
			Media.upload_panel(tab_type,tab_content_target);
		break;
		//////////////////////
	}
	/*
	"file_panel"         : {
		"side_id":"",
		"list_id":"",
		"item_key":"",
		"delete_id":"delete-selected-item",
	},
	*/

	
	//var active = (k==0)?'class="active"':'';
}

Media.upload_panel=function(tab_type,tab_content_target){
	Media.desable_use();
	var allowed_files = Media.setting.allowed_files;
	var valid_ext = Media.valid_ext;
	var current_types = Media.setting.file_type
	var valid_ext_code="";
	$.each(current_types,function(k,v){
		//console.log("k: "+k);
		//console.log("v: "+v);
		valid_ext_code+= '<ol>'+allowed_files[v]["title"]+': <span>.'+(valid_ext[v].join(", ."))+'</span></ol>';
	});
		
	var upload_form='<form class="upload-form upload-box" method="post" action="" enctype="multipart/form-data"><div id="dragandrophandler"><input class="box__file" type="file" name="files[]" id="M-File" data-multiple-caption="{count} files selected" multiple /><label for="M-File"><div class="upload-text"><strong>اختر الملف</strong><span class="drag-text"> أو قم بسحبه وإفلاته هنا</span>.<div class="valid-ext"><dl>الإمتدادات المتاحة</dl><ul>'+valid_ext_code+'</ul></div><div id="upload-error"></div></div></label><button class="upload-button" type="submit">Upload</button></div></form>';
	
	
	var upload_tab='<div class="media-upload-tab">'+upload_form+'</div>';
	
	tab_content_target.html(upload_tab);
	////////////////////
	//upload
	
	var obj = $("#dragandrophandler");
	var file_input=obj.find('input[type=file]');
	/////////////////////////////
	file_input.change(function(e){
		var fileName = $(this).val();
		//console.log("fileName");
		//console.log(fileName);
	    e.preventDefault();
	    //var files = e.originalEvent.dataTransfer.files;
	    var files = e.originalEvent.target.files;
		var FileList=files.FileList;
		var FileLength=files.length;
		if(FileLength > 0){
			 Media.Upload(files);
		}
		//console.log("files");
		//console.log(files);
	});
	/////////////////////////////
	Media.setting.upload_obj=obj;
	obj.on('dragenter', function (e){
		e.stopPropagation();
		e.preventDefault();
		//$(this).addClass("dragenter");
		$(this).css('border', '2px solid #337ab7');
	});
	obj.on('dragover', function (e){
		 e.stopPropagation();
		 e.preventDefault();
	});
	obj.on('dragleave', function (e){
		 e.stopPropagation();
		 e.preventDefault();
		 $(this).css('border', '2px dotted #dddddd');
	});
	obj.on('drop', function (e){
	 
		 $(this).css('border', '2px dotted #337ab7');
		 //$(this).addClass("dragdroped");
		 e.preventDefault();
		 var files = e.originalEvent.dataTransfer.files;
	 
		 //We need to send dropped files to Server
		 //console.log("--------- files ---------");
		 //console.log(files);
		 Media.Upload(files);
	});	
	
	//If the files are dropped outside the div, file is opened in the browser window. To avoid that we can prevent ‘drop’ event on document.
	$(document).on('dragenter', function (e){
		e.stopPropagation();
		e.preventDefault();
	});
	$(document).on('dragover', function (e){
	  e.stopPropagation();
	  e.preventDefault();
	  //obj.css('border', '2px dotted #337ab7');
	  //obj.addClass("dragenter");;
	});
	$(document).on('drop', function (e){
		e.stopPropagation();
		e.preventDefault();
	});	
	
	/////////////////////
}


Media.uploading_file_info=function(file){
	/*
	upload_obj:false,
	upload_status:false,
	upload_error:{},
	upload_files:{accepted:{},ignore:{}},
	*/	
	var file_info={
			"size":{
				"kb":file.size,
			},
			"name":file.name,
			"type":file.type.split("/")[0],
			"ext" :file.name.split('.').pop(),
		};
	file_info.size[0]=Media.calculate_size(file.size);
	return file_info;
};

Media.calculate_size = function(size){
	if (size > 1024 * 1024){
		return  (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + ' MB';
	}else{
		return (Math.round(size * 100 / 1024) / 100).toString() + ' KB';
	}
};

Media.prepare_upload_file=function(file){
	
	var file_info = Media.uploading_file_info(file);
	var accepted_types = Media.setting.file_type;
	var valid_ext = Media.valid_ext;
	///////////////////////////////////////////////////////
	//.hasOwnProperty($file_type
	if(!file.type){
		file_info["type"]=false;
		if(jQuery.inArray( file_info["ext"], valid_ext["documents"] ) >= 0 ){
			file_info["type"]="documents";
		}
		if(jQuery.inArray( file_info["ext"], valid_ext["archive"] ) >= 0 ){
			file_info["type"]="archive";
		}
		if(jQuery.inArray( file_info["ext"], valid_ext["photo"] ) >= 0 ){
			file_info["type"]="photo";
		}
		if(jQuery.inArray( file_info["ext"], valid_ext["video"] ) >= 0 ){
			file_info["type"]="video";
		}
		if(jQuery.inArray( file_info["ext"], valid_ext["audio"] ) >= 0 ){
			file_info["type"]="audio";
		}
	}else{
		//alert("file.type: "+file.type);
		if( file_info["type"] == "image" ){
			file_info["type"]="photo";
		}
		if( file_info["type"] == "text" ){
			file_info["type"]="documents";
		}
		var FT=file.type.split("/")[0];
		if( FT != "text" &&  FT !="image" ){
			if(jQuery.inArray( file_info["ext"] , valid_ext["documents"] ) >= 0 ){
				file_info["type"]="documents";
			}
			if(jQuery.inArray( file_info["ext"] , valid_ext["archive"] ) >= 0 ){
				file_info["type"]="archive";
			}
		}
	}
	

	if( jQuery.inArray( file_info["type"], accepted_types ) >= 0 ){
		//alert("file.type: "+file_info["type"]);
		if( jQuery.inArray( file_info["ext"], valid_ext[file_info["type"]] ) >= 0 ){
			Media.setting.upload_files["accepted"][file_info["name"]]={"file":file,"info":file_info};
		}else{
			Media.setting.upload_files["ignore"][file_info["name"]]=file.name;
		}
	}else{
		Media.setting.upload_files["not_allowed"][file_info["name"]]=file.name;
	}
	

};


Media.reset_upload=function(){
	Media.setting.upload_status=false;
	Media.setting.upload_error={};
	Media.setting.upload_files={accepted:{},ignore:{},not_allowed:{}};
}

Media.Upload=function(files){
	var obj = Media.setting.upload_obj;
	Media.reset_upload();
	for (var i = 0; i < files.length; i++){
		Media.prepare_upload_file(files[i]);
	}
   
	
	var $upload_obj = Media.setting.upload_obj;
	$upload_obj.find("#upload-error").html("");
	
	var $ignored_count=0;
	var $ignored_code='';
	if(Object.keys(Media.setting.upload_files["ignore"]).length > 0){
		$.each(Media.setting.upload_files["ignore"],function(k,v){
			$ignored_code+='<dl> تم إستبعاد الملف "'+v+'" لان الإمتداد غير مسموح به.</dl>';
			$ignored_count++;
		});
	}
	
	if(Object.keys(Media.setting.upload_files["not_allowed"]).length > 0){
		$.each(Media.setting.upload_files["not_allowed"],function(k,v){
			$ignored_code+='<dl> تم إستبعاد الملف "'+v+'" لان نوعية الملف غير مسموح بها.</dl>';
			$ignored_count++;
		});
	}
	
	var tab_content_target=$('#'+Media.setting.defaultes.modal_id+" "+Media.setting.defaultes.tab_content_trget);
	var media_upload_tab=$('#'+Media.setting.defaultes.modal_id+" .media-upload-tab");
	
	if( Object.keys(Media.setting.upload_files["accepted"]).length > 0 ){
		Media.setting.upload_status="ready";
		media_upload_tab.html('<div class="progress-box"><div id="upload-error"></div><div class="progress-list"></div></div>');
		Media.desable_tabs();
		Media.start_upload();
		//media-upload-tab
		//alert("found files to uplaod");
	}
	
	if( $ignored_count > 0){
		var allowed_files = Media.setting.allowed_files;
		var valid_ext = Media.valid_ext;
		var current_types = Media.setting.file_type
		var valid_ext_code="";
		media_upload_tab.find("#upload-error").append($ignored_code);
		if(Media.setting.upload_status=="ready"){
			$.each(current_types,function(k,v){
				//console.log("k: "+k);
				//console.log("v: "+v);
				valid_ext_code+= '<ol>'+allowed_files[v]["title"]+': <span>.'+(valid_ext[v].join(", ."))+'</span></ol>';
				$ignored_count++;
			});
			media_upload_tab.find("#upload-error").append('<div class="valid-ext"><dl>الإمتدادات المتاحة</dl><ul>'+valid_ext_code+'</ul></div>');
		}
	}
	if(Media.setting.upload_status=="ready"){
		//console.log("Media.setting.upload_status is ready");
		//console.log(Media.setting);
	  //for (var i = 0; i < files.length; i++){
		  //var fd = new FormData();
		  //fd.append('file', files[i]);
	  
		  //var status = new createStatusbar(obj); //Using this we can set progress.
		  //status.setFileNameSize(files[i].name,files[i].size);
		  //sendFileToServer(fd,status);
	  //}
	}

};

Media.start_upload=function(){
	if(Media.setting.upload_status=="ready"){
		var files=Media.setting.upload_files["accepted"];
		/////////////////////////////////////////////////
		var tab_container=$('#'+Media.setting.defaultes.modal_id+" .progress-box");
		var progress_container=$('#'+Media.setting.defaultes.modal_id+" .progress-list");
		var error_container=$('#'+Media.setting.defaultes.modal_id+" #upload-error");
	
		var progresses_code='<ul id="progress-container"></ul>';
		progress_container.append(progresses_code);
		/////////////////////////////////////////////////
		$.each(files,function(k,accepted_file){
			var file=accepted_file["file"];
			var file_info=accepted_file["info"];
			/////////////////////////
			// set progress
			/////////////////////////
			Media.uploading_count++;
			var status = new Media.CreateStatusBar(file_info); //Using this we can set progress.
			Media.SendFileToServer(file,file_info,status);
			Media.desable_tabs();
			//Media.prototype.status= new createStatusbar();
			
			//console.log("---- accepted file ----");
			//console.log("k: "+k);
			//console.log("accepted_file:");
			//console.log(accepted_file);
			//console.log("---- ---- ---- ----");
			
		});
		/////////////////////
		//insert progress-bars
		/////////////////////////////////////////////////
	}
};


Media.desable_use=function(){
	if(Media.uploading_count>0){
		return false;
	}
	$('#'+Media.setting.defaultes.modal_id+" .modal-footer #useit").addClass("desable");
	//alert("desable_use");
};


Media.enable_use=function(){
	if(Media.uploading_count>0){
		return false;
	}
	$('#'+Media.setting.defaultes.modal_id+" .modal-footer #useit").removeClass("desable");
	//alert("enable_use");
};


Media.desable_tabs=function(){
	if(Media.uploading_count>0){
		return false;
	}
	$('#'+Media.setting.defaultes.modal_id+" .modal-footer #dismiss").hide();
	$('#'+Media.setting.defaultes.modal_id+" #modal-tabs").find("li").addClass("desable");
	//alert("desable_tabs");
};
Media.enable_tabs=function(){
	if(Media.uploading_count>0){
		return false;
	}
	$('#'+Media.setting.defaultes.modal_id+" .modal-footer #dismiss").show();
	$('#'+Media.setting.defaultes.modal_id+" #modal-tabs").find("li").removeClass("desable");
	//alert("enable_tabs");
};

Media.SendFileToServer=function (file,file_info,status){
    //var uploadURL ="http://hayageek.com/examples/jquery/drag-drop-file-upload/upload.php"; //Upload URL
    var uploadURL =$ajax_path+"?action=media-upload-file";
	//var uploadURL = "http://perfectvision.com/projects/ajax-upload.php";
	var valid_ext = Media.valid_ext;
	
    var extraData ={}; //Extra Data.
    
	var xhr = new XMLHttpRequest(); 
	//var formData = new FormData($("#fileup-form-test"));
	var formData = new FormData();
	formData.append('pv_ext', valid_ext[file_info["type"]].join("|") );
	formData.append('pv_type', file_info["type"]);
	//console.log("------file:");
	//console.log(file);
	
	
	xhr.addEventListener("load"     ,  function(evt){status.Completeed(evt,status)},false);
	xhr.addEventListener("error"    ,  function(evt){status.setAbort(evt,status)},false);
	xhr.addEventListener("abort"    ,  function(evt){status.setAbort(evt,status)},false);
	xhr.upload.addEventListener("progress" ,  function(evt){status.setProgress(evt,status)},false);
	
	xhr.open( "POST", uploadURL , true );
	formData.append('file', file );
	xhr.send(formData);
	 
	
	/*
	jqXHR=$.ajax({
			url: uploadURL,
			//type: "POST",
			//data: formData,
			xhr: function() {
				var xhrobj = $.ajaxSettings.xhr();
					xhrobj.open("POST", uploadURL);
					xhrobj.send(formData)
					console.log("--------- xhrobj ---------");
					console.log(xhrobj);
					//xhrobj.send(formData);

				if (xhrobj.upload) {
						console.log("--------- xhrobj.upload ---------");
						console.log(xhrobj.upload);
						
						xhrobj.upload.addEventListener('progress', function(event) {
							var percent = 0;
							var position = event.loaded || event.position;
							var total = event.total;
							if (event.lengthComputable) {
								percent = Math.ceil(position / total * 100);
							}
							//Set progress
							status.setProgress(percent);
						}, false);
					}
				return xhrobj;
			},
			contentType: false,
			processData: false,
			cache: false,
			error: function(e) { alert('خطأ:\n\r' + e.statusText); } ,
			success: function(result){
					console.log("--------- Ajax success result ---------");
					console.log(result);
					if( typeof result =="object" && result.hasOwnProperty("success")){
						if( result.hasOwnProperty("success") && result.success == true ){
							var data=result.data;
							var data=result.data;
							status.setProgress(100);
							//console.log("--------- data ---------"+event.target.response);
							console.log("--------- data.file ---------");
							console.log(data.file);
							alert("success:\n\r"+data.file);
						}else{
							var error=result.error;
							alert("خطأ:\n\r"+error);
						}
					}else{
						alert("خطأ في الإتصال, إتصال غير أمن.");
					}
					//$("#status1").append("File upload Done<br>");         
				}
    }); 
    status.setAbort(jqXHR);
	*/
};



Media.CreateStatusBar=function (file_info){
    
	////////////////////////
	var progress_container=$('#'+Media.setting.defaultes.modal_id+" .progress-list #progress-container");
	
	this.statusbar = $("<li></li>");
	this.file_info = $('<div class="col-sm-5 file-name" file-type="'+file_info["type"]+'" ><ol>'+file_info["name"]+'</ol><ol class="file-size">'+file_info["size"][0]+'</ol></div>').appendTo(this.statusbar);
	
	this.progressBar = $('<div class="col-sm-6"><div class="progress"><div class="progress-bar progress-bar-info progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div></div></div>').appendTo(this.statusbar);
	
	this.abort = $('<div class="col-sm-1 abort"><div id="abort">إلغاء</div></div>').appendTo(this.statusbar);
	this.useit = $('<div class="col-sm-1 useit"><div id="useit">إستخدام</div></div>').appendTo(this.statusbar).hide();
	progress_container.append(this.statusbar);
	
	//return false;
 	//return false;

    this.Completeed = function(evt){
		//console.log("-- Completeed --");
		var response= JSON.parse(evt.currentTarget.response);
		//console.log(response);
		Media.uploading_count--;
		this.useit.show();
		Media.enable_tabs();
		if(typeof response === "object" ){
			if(response.data.code==0){
				//append uploaded_files;
				//var New_key=Object.keys(Media.file_relation[response.data.result.type])[0];
				if(Object.keys(Media.files[response.data.result.type]).length > 0){
					var new_ob={};
					new_ob[0]=response.data.result.id;
					$.each(Media.file_relation[response.data.result.type],function(key,id){
						var k = parseInt(key)+1;
						new_ob[k]=id;
						Media.files[response.data.result.type][id]["relation"]=k;
						//response.data.result
					});
					Media.file_relation[response.data.result.type]=new_ob;
					//console.log("New_key------------------------------------------");
					//console.log(Media.file_relation[response.data.result.type]);
				}
				///////////////////////////
				if(Media.uploading_count==0){
					Media.selected=response.data.result.id;
				}
				///////////////////////////
				Media.append(response.data.result,"new");
				///////////////////////////
				if(Media.uploading_count==0){
					Media.LoadTab(response.data.result.type,"upload");
					Media.select_file(response.data.result.id);
				}
			}else{
				alert(response.data.result);
			}
		}else{
			alert(evt.currentTarget.response);
		}
		//alert("-- Completeed --");
		//return false;
	};
	
	this.setProgress = function(evt){       
		//console.log("-- setProgress --");
		//console.log(evt);
		//console.log(evt.lengthComputable); // false
		
		 if (evt.lengthComputable) {
			var progress = Math.round(evt.loaded * 100 / evt.total);
			//$(".html5-progress").find(".html5-progress-bar").css("width",percentComplete.toString() + '%');
			//$(".html5-progress").find(".html5-progress-text").text(percentComplete.toString() + '%');
			var progressBarWidth =progress*this.progressBar.width()/ 100;  
			this.progressBar.find('*[role="progressbar"]').animate({ width: progressBarWidth }, 10).attr("aria-valuenow",progress).html(progress + "% ");
			if(parseInt(progress) >= 100)
			{
				this.abort.hide();
				this.progressBar.find('*[role="progressbar"]').removeClass("active").removeClass("progress-bar-info").addClass("progress-bar-success").html(" إكتمل الرفع");
			}
		 }
		
		
		/*
		var progress= evt.loaded ;
		var progressBarWidth =progress*this.progressBar.width()/ 100;  
        this.progressBar.find('*[role="progressbar"]').animate({ width: progressBarWidth }, 10).attr("aria-valuenow",progress).html(progress + "% ");
        if(parseInt(progress) >= 100)
        {
            this.abort.find('#abort').hide();
			this.progressBar.find('*[role="progressbar"]').removeClass("active").removeClass("progress-bar-info").addClass("progress-bar-success").html(" إكتمل الرفع");
        }
		*/
		//return false;
    };
    
	
	this.setAbort = function(evt){
		//alert("-- setAbort --");
		//console.log("-- setAbort --");
		//console.log(evt);
		Media.uploading_count--;
		//return false;
        var sb = this.statusbar;
        this.abort.find('#abort').click(function(){
            this.xhr.abort();
            sb.hide();
        });
    };
	
	this.error = function(evt){
		//alert("-- error --");
		//console.log("-- error --");
		//console.log(evt);
		Media.uploading_count--;
		//return false;
        var sb = this.statusbar;
        this.abort.find('#abort').click(function(){
            this.xhr.abort();
            sb.hide();
        });
    };
	
}
/////////////////////////////////////////
/////////////////////////////////////////
Media.file_panel=function(tab_type,tab_content_target){
	/*
	"file_panel"         : {
		"side_id":"",
		"list_id":"",
		"item_key":"",
		"delete_id":"delete-selected-item",
	},
	*/
	Media.desable_use();
	var panel_ids=Media.setting.defaultes.file_panel;
	var panel_code='<div class="col-sm-9 col-xs-8 media-list" id="'+panel_ids["list_id"]+'"><div class="list"></div></div><div class="col-sm-3 col-xs-4 media-selected-file" id="'+panel_ids["side_id"]+'"></div><div class="media-clear"></div>';
	tab_content_target.html(panel_code);
	//if(!Media.tabs_loaded.hasOwnProperty(tab_type)){
	if( Media.LoadedDataPage[tab_type] > 0 || Media.tabs_loaded.hasOwnProperty(tab_type) ){
		Media.display_content();
	}else{
		Media.load_contents();
	}
	/*
	if(!Media.tabs_loaded.hasOwnProperty(tab_type) || Object.keys(Media.files[tab_type]).length > 0){
		if( typeof Media.files[tab_type]==="object" && Media.files.hasOwnProperty(tab_type) ){
			Media.display_content();
		}else{
			Media.load_contents();
		}
	}else{
		Media.display_content();
	}
	*/
	//Media.display_contents();
	//file_id=1;
	//Media.select_file(file_id);
	//<dl>تفاصيل المرفق</dl><div></div>
	
};
/////////////////////////////////////////
/////////////////////////////////////////
Media.delete_file=function(file_id){
	//console.log("--- delete ---");
	// confirm code
	///////////////
	var panel_ids=Media.setting.defaultes.file_panel;
	var modal_id=Media.setting.defaultes.modal_id;
	var tab_content_trget=Media.setting.defaultes.tab_content_trget;
	var content_target=$('#'+modal_id+" "+tab_content_trget+" #"+panel_ids["list_id"]).children(".list");
	var file_info_container=$('#'+modal_id+" "+tab_content_trget+" #"+panel_ids["side_id"]);
	//$item.fadeOut(250);
	//////////////////////////////////////////////
	$.confirm({
		title: 'هل انت متأكد من حذف الملف ؟',
		content: 'يرجي العلم انه في حالة حذف الملف سوف يتم حذفة من جميع محتوايات الموقع ولن يمكنك الرجوع في هذه الخطوه.',
		buttons: {
			confirm:{ 
				text:"تأكيد الحذف",
				btnClass: 'btn-red',
				keys: ['enter'],
				action:function () {
					//$.alert('Confirmed!');
					var DeleteAction= new Media.DoDelete(file_id,file_info_container);
					DeleteAction.loading(true);
					DeleteAction.Ajax_delete();
					//////////
					DeleteAction.on("deleted",function($this){
						//console.log("DeleteAction");
						//console.log($this);
						///////////////
						var file=Media.files[tab_type][$this.id];
						var relation_key = file.relation;
						///////////////
						// removing from Media objects 
						delete(Media.files[tab_type][$this.id]);
						delete(Media.file_relation[tab_type][relation_key]);
						///////////////
						var $item=content_target.children(".media-item[media-id="+$this.id+"]");
						$item.fadeOut(250,function(){
							$item.html("").remove();
							file_info_container.find(".selected-file-info[media-id="+$this.id+"]").html("").remove();
							Media.selected = 0;
							Media.desable_use();
							//return false;
						});
					});
					//////////
					DeleteAction.on("error",function($this){
						//console.log("DeleteAction error");
						$this.loading(false);
						alert($this.error);
					});
					//////////
					DeleteAction.on("abort",function($this){
						//console.log("DeleteAction abort");
						$this.loading(false);
						alert($this.error);
					});
					//////////////////////////////////////////////
					//////////////////////////////////////////////
					if(Media.multi){
					}
					///////////////
					//console.log(Media.files[tab_type]);
					//console.log(Media.file_relation[tab_type]);
				}
			},
			cancel:{ 
				text:"إلغاء",
				keys: ['esc'],
				btnClass: 'btn-dark',
				action:function () {
					//$.alert('Canceled!');
				}
			},
			//somethingElse: {
				//text: 'Something else',
				//btnClass: 'btn-primary',
				//keys: ['enter', 'shift'],
				//action: function(){
					//$.alert('Something else?');
				//}
			//}
		}
	});	
	//////////////////////////////////////////////
	//////////
	///////////////
	//alert("delete");
}
Media.DoDelete=function(file_id,file_info_container){
	//////////////////////
	this.id=file_id;
	this.container=file_info_container;
	this.error=false;
	//////////////////////
	var $this = this;
	//////////////////////
	var _triggers = {};
	this.on = function(event,callback) {
		if(!_triggers[event])
			_triggers[event] = [];
		_triggers[event].push( callback );
	  }
  
	this.triggerHandler = function(event,params) {
		if( _triggers[event] ) {
			for( i in _triggers[event] )
				_triggers[event][i](params);
		}
	}
	//////////////////////
	this.loading=function(status){
		var $item=$this.container.find(".selected-file-info[media-id="+$this.id+"]");
		if(status){
			$item.append('<div id="delete-loading"><span>جاري حذف الملف</span></div>');
		}else{
			var $loading=$item.find("#delete-loading");
			$loading.fadeOut(200,function(){
				$loading.html("").remove();
			});
		}
	}
	//////////////////////
	this.Ajax_delete=function(){
		var URL = $ajax_path + "?action=delete-attachment";
		var xhr = new XMLHttpRequest(); 
		var formData = new FormData();
		formData.append('to-delete', $this.id );
		xhr.addEventListener("load"     ,  function(evt){$this.Completeed(evt,$this)},false);
		xhr.addEventListener("error"    ,  function(evt){$this.Completeed(evt,$this)},false);
		xhr.addEventListener("abort"    ,  function(evt){$this.Completeed(evt,$this)},false);
		xhr.open( "POST", URL , true );
		xhr.send(formData);
	}
	//////////////////////
	this.Completeed=function(evt,$this){
		console.log("-- Ajax_delete Completeed --");
		console.log(evt.currentTarget.response);
		var response= JSON.parse(evt.currentTarget.response);
		//console.log(response);
		if(typeof response === "object" ){
			if(response.data.code==200){
				$this.triggerHandler("deleted",$this);
			}else{
				//alert(response.data.result);
				$this.error=response.data.error;
				$this.triggerHandler("error",$this);
			}
		}else{
			$this.error=evt.currentTarget.response;
			$this.triggerHandler("error",$this);
			//alert(evt.currentTarget.response);
		}
		
	}
	//////////////////////
	this.error=function(evt,$this){
		$this.error="خطأ أثناء عملية الحذف";
		$this.triggerHandler("error",$this);
	}
	//////////////////////
	this.abort=function(evt,$this){
		$this.error="تم إقاف عملية الحذف";
		$this.triggerHandler("abort",$this);
	}
	//////////////////////
	/*
	var uploadURL =$ajax_path+"?action=media-upload-file";
	var valid_ext = Media.valid_ext;
    var extraData ={}; 
	var xhr = new XMLHttpRequest(); 
	var formData = new FormData($("#fileup-form-test"));
	formData.append('pv_ext', valid_ext[file_info["type"]].join("|") );
	formData.append('pv_type', file_info["type"]);
	xhr.addEventListener("load"     ,  function(evt){status.Completeed(evt,status)},false);
	xhr.addEventListener("error"    ,  function(evt){status.setAbort(evt,status)},false);
	xhr.addEventListener("abort"    ,  function(evt){status.setAbort(evt,status)},false);
	xhr.open( "POST", uploadURL , true );
	formData.append('file', file );
	xhr.send(formData);
	*/
}
/////////////////////////////////////////
/////////////////////////////////////////
Media.select_file=function(file_id){
	Media.selected=file_id;
	var tab_type=Media.setting.defaultes.current_tab;
	Media.setting.media_object.selected_type=tab_type;
	var file=Media.files[tab_type][file_id];
	var panel_ids=Media.setting.defaultes.file_panel;
	
	var itemAv='<div class="media-avatar" type="'+file["type"]+'" icon="'+file["ext"]+'" ></div>';
	if(tab_type=="photo"){
		itemAv='<img src="'+file["url"]+'"/>';
	}
	//console.log("file");
	//console.log(file);
	var html='<div class="selected-file-info" media-id="'+file_id+'">';
		html+='<dl>تفاصيل الملف</dl>';
		html+='<div class="viewport">'+itemAv+'</div>';
		html+='<ul class="info">';
		html+='<li class="name">'+file["name"]+'</li>';
		html+='<li >'+file["date"]+'</li>';
		html+='<li class="en" dir="ltr" style="text-align:right" >'+Media.calculate_size(file["size"]);+'</li>';
		if(tab_type=="photo"){
			html+='<li class="en" dir="ltr" style="text-align:right" >'+file["width"]+' X '+file["height"]+'</li>';
		}
		html+='<li><a href="#" data-target="'+file["id"]+'" id="'+panel_ids["delete_id"]+'" > حذف الملف ؟</a></li>';
		html+='</ul>';
		html+='</div>';
	
	
	$('#'+Media.setting.defaultes.modal_id+" #"+panel_ids["side_id"]).html(html);
	$("#"+panel_ids["side_id"]).find("#"+panel_ids["delete_id"]).on("click",function(e){
		//alert("delete event");
		var file_id=$(this).attr('data-target');
		//console.log("delete event");
		//console.log("Media.setting.selected['id']: "+Media.setting.selected);
		//console.log(Media);
		if(Media.files[tab_type].hasOwnProperty(file_id)){
			Media.delete_file(file_id);
		}
		/*
		if(Media.setting.selected.hasOwnProperty("id")){
			delete_file(Media.setting.selected["id"]);
		}
		*/
		return false;
		e.preventDefault();
	});
	Media.enable_use();
	/*
<dl>تفاصيل المرفق</dl>
<div class="viewport"><img src=""/></div>
<ul class="info">
  <li class="name">ddfds-jklsdmn.png</li>
  <li >25 اغسطس 2016</li>
  <li >150 x 300</li>
  <li class="delete"><a href="#"> حذف الملف ؟</a></li>
</ul>
	*/	
	
}
/////////////////////////////////////////
/////////////////////////////////////////
Media.on('installed', function() {
	//alert('installed!');
	//console.log("------ Media Liberrary installed ------");
	//console.log("Media prototypes:");
	//console.log(Media);
	//console.log("------ media.liberrary.js .ready ------");
});
/////////////////////////////////////////
/////////////////////////////////////////
/*
*  document ready case
**/
///////////////////////////////////
$(document).ready(function(e) {
	var $options={
	}
	Media.install($options);
});
calculate_size = function(size){
	if (size > 1024 * 1024){
		return  (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + ' MB';
	}else{
		return (Math.round(size * 100 / 1024) / 100).toString() + ' KB';
	}
};
