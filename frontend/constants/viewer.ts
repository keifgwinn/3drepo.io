export const VIEWER_NAV_MODES = {
	HELICOPTER: 'HELICOPTER',
	TURNTABLE: 'TURNTABLE'
};

export const VIEWER_CLIP_MODES = {
	SINGLE: 'SINGLE',
	BOX: 'BOX'
};

export const VIEWER_MAP_SOURCES = {
	OSM: 'OSM',
	HERE: 'HERE',
	HERE_AERIAL: 'HERE_AERIAL',
	HERE_TRAFFIC: 'HERE_TRAFFIC',
	HERE_TRAFFIC_FLOW: 'HERE_TRAFFIC_FLOW'
};

export const VIEWER_EVENTS = {
	ADD_PIN: 'VIEWER_ADD_PIN',
	BACKGROUND_SELECTED: 'VIEWER_BACKGROUND_SELECTED',
	BACKGROUND_SELECTED_PIN_MODE: 'BACKGROUND_SELECTED_PIN_MODE',
	BBOX_READY: 'BBOX_READY',
	CHANGE_PIN_COLOUR: 'VIEWER_CHANGE_PIN_COLOUR',
	CLEAR_CLIPPING_PLANES: 'VIEWER_CLEAR_CLIPPING_PLANES',
	CLICK_PIN: 'VIEWER_CLICK_PIN',
	CLIPPING_PLANE_BROADCAST: 'VIEWER_CLIPPING_PLANE_BROADCAST',
	CLIPPING_PLANE_READY: 'VIEWER_CLIPPING_PLANE_READY',
	ENTER_VR: 'VIEWER_EVENT_ENTER_VR',
	GET_CURRENT_OBJECT_STATUS: 'VIEWER_GET_CURRENT_OBJECT_STATUS',
	GET_CURRENT_VIEWPOINT: 'VIEWER_GET_CURRENT_VIEWPOINT',
	GET_SCREENSHOT: 'VIEWER_GET_SCREENSHOT',
	GO_HOME: 'VIEWER_GO_HOME',
	HIGHLIGHT_OBJECTS: 'VIEWER_HIGHLIGHT_OBJECTS',
	INITIALISE: 'VIEWER_EVENT_INITIALISE',
	LOADED: 'VIEWER_EVENT_LOADED',
	LOAD_MODEL: 'VIEWER_LOAD_MODEL',
	LOGO_CLICK: 'VIEWER_LOGO_CLICK',
	MEASURE_MODE_CLICK_POINT: 'VIEWER_MEASURE_MODE_CLICK_POINT',
	MODEL_LOADED: 'VIEWER_MODEL_LOADED',
	MOVE_PIN: 'VIEWER_MOVE_PIN',
	MOVE_POINT: 'VIEWER_MOVE_POINT',
	OBJECT_SELECTED: 'VIEWER_OBJECT_SELECTED',
	MULTI_OBJECTS_SELECTED: 'VIEWER_MULTI_OBJECTS_SELECTED',
	PICK_POINT: 'VIEWER_PICK_POINT',
	REGISTER_MOUSE_MOVE_CALLBACK: 'VIEWER_REGISTER_MOUSE_MOVE_CALLBACK',
	REGISTER_VIEWPOINT_CALLBACK: 'VIEWER_REGISTER_VIEWPOINT_CALLBACK',
	REMOVE_PIN: 'VIEWER_REMOVE_PIN',
	RUNTIME_READY: 'VIEWING_RUNTIME_READY',
	SET_CAMERA: 'VIEWER_SET_CAMERA',
	SET_NAV_MODE: 'VIEWER_SET_NAV_MODE',
	SET_PIN_VISIBILITY: 'VIEWER_SET_PIN_VISIBILITY',
	START_LOADING: 'VIEWING_START_LOADING',
	SWITCH_FULLSCREEN: 'VIEWER_SWITCH_FULLSCREEN',
	SWITCH_OBJECT_VISIBILITY: 'VIEWER_SWITCH_OBJECT_VISIBILITY',
	UNITY_ERROR: 'VIEWER_EVENT_UNITY_ERROR',
	UNITY_READY: 'VIEWER_EVENT_UNITY_READY',
	UPDATE_CLIPPING_PLANES: 'VIEWER_UPDATE_CLIPPING_PLANE',
	VR_READY: 'VIEWER_EVENT_VR_READY',
	NAV_MODE_CHANGED: 'NAV_MODE_CHANGED',
	UPDATE_NUM_CLIP: 'VIEWER_UPDATE_NUM_CLIP',
	TOGGLE_PANEL: 'VIEWER_TOGGLE_PANEL'
};

export const VIEWER_ERRORS = {
	PIN_ID_TAKEN: 'VIEWER_PIN_ID_TAKEN'
};

export const DEFAULT_SETTINGS = {
	shading: 'standard',
	shadows: 'none',
	xray: true,
	statistics: false,
	memory: 2032,
	nearPlane: 10,
	farPlaneSamplingPoints: 5,
	farPlaneAlgorithm: 'box'
};

export const VIEWER_PANELS = {
	METADATA: 'metadata',
	RISKS: 'risks',
	ISSUES: 'issues',
	GROUPS: 'groups',
	VIEWS: 'views',
	TREE: 'tree',
	COMPARE: 'compare',
	GIS: 'gis'
};

export const VIEWER_TOOLBAR_ITEMS = {
	EXTENT: 'Extent',
	TURNTABLE: 'Turntable',
	HELICOPTER: 'Helicopter',
	SHOW_ALL: 'Show All',
	HIDE: 'Hide',
	ISOLATE: 'Isolate',
	FOCUS: 'Focus',
	CLIP: 'Clip',
	MEASURE: 'Measure',
	BIM: 'BIM'
};

export const INITIAL_HELICOPTER_SPEED = 1;
export const MIN_HELICOPTER_SPEED = -99;
export const MAX_HELICOPTER_SPEED = 99;

export const VIEWER_PIN_MODE = {
	NORMAL: 'NORMAL',
	PIN: 'PIN'
};
