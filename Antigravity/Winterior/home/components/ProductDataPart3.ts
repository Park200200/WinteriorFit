
import { NodeData } from '../types';

export const nodesPart3: Record<string, NodeData> = {
  "root-1768364888562": {
    "id": "root-1768364888562",
    "parentId": null,
    "type": "ROOT",
    "label": "시스템",
    "isExpanded": true,
    "childrenIds": [
      "sys-node-main"
    ],
    "attributes": {
      "nodeType": "root",
      "treeType": "system"
    }
  },
  "sys-node-main": {
    "id": "sys-node-main",
    "parentId": "root-1768364888562",
    "type": "CATEGORY",
    "label": "시스템",
    "isExpanded": true,
    "childrenIds": [
      "sys-cat-blind",
      "sys-cat-curtain"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-cat-blind": {
    "id": "sys-cat-blind",
    "parentId": "sys-node-main",
    "type": "CATEGORY",
    "label": "블라인드",
    "isExpanded": true,
    "childrenIds": [
      "sys-sub-roll",
      "sys-sub-combi"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-sub-roll": {
    "id": "sys-sub-roll",
    "parentId": "sys-cat-blind",
    "type": "CATEGORY",
    "label": "롤(원단)",
    "isExpanded": true,
    "childrenIds": [
      "sys-roll-std",
      "sys-roll-ultra",
      "sys-roll-power"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-roll-std": {
    "id": "sys-roll-std",
    "parentId": "sys-sub-roll",
    "type": "DATA",
    "label": "스텐다드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-roll-ultra": {
    "id": "sys-roll-ultra",
    "parentId": "sys-sub-roll",
    "type": "DATA",
    "label": "울트라",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-roll-power": {
    "id": "sys-roll-power",
    "parentId": "sys-sub-roll",
    "type": "DATA",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-cat-curtain": {
    "id": "sys-cat-curtain",
    "parentId": "sys-node-main",
    "type": "CATEGORY",
    "label": "커튼",
    "isExpanded": true,
    "childrenIds": [
      "sys-sub-inner-curtain",
      "sys-sub-outer-curtain"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-sub-inner-curtain": {
    "id": "sys-sub-inner-curtain",
    "parentId": "sys-cat-curtain",
    "type": "CATEGORY",
    "label": "속커튼",
    "isExpanded": true,
    "childrenIds": [
      "sys-inner-gen",
      "sys-inner-power"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-inner-gen": {
    "id": "sys-inner-gen",
    "parentId": "sys-sub-inner-curtain",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-inner-power": {
    "id": "sys-inner-power",
    "parentId": "sys-sub-inner-curtain",
    "type": "DATA",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-sub-outer-curtain": {
    "id": "sys-sub-outer-curtain",
    "parentId": "sys-cat-curtain",
    "type": "CATEGORY",
    "label": "겉커튼",
    "isExpanded": true,
    "childrenIds": [
      "sys-outer-gen"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-outer-gen": {
    "id": "sys-outer-gen",
    "parentId": "sys-sub-outer-curtain",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-sub-combi": {
    "id": "sys-sub-combi",
    "parentId": "sys-cat-blind",
    "type": "CATEGORY",
    "label": "콤비",
    "isExpanded": true,
    "childrenIds": [
      "sys-combi-std",
      "sys-combi-ultra",
      "sys-combi-power"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "sys-combi-std": {
    "id": "sys-combi-std",
    "parentId": "sys-sub-combi",
    "type": "DATA",
    "label": "스텐다드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-combi-ultra": {
    "id": "sys-combi-ultra",
    "parentId": "sys-sub-combi",
    "type": "DATA",
    "label": "울트라",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "sys-combi-power": {
    "id": "sys-combi-power",
    "parentId": "sys-sub-combi",
    "type": "DATA",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "system"
    }
  },
  "node-1768364980930": {
    "id": "node-1768364980930",
    "parentId": "modified-sub-wood-1768364980930",
    "type": "CATEGORY",
    "label": "스텐다드",
    "isExpanded": true,
    "childrenIds": [
      "node-1768365076787",
      "node-1768368609030",
      "node-1768369246834"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768364990488": {
    "id": "node-1768364990488",
    "parentId": "modified-sub-wood-1768364980930",
    "type": "CATEGORY",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [
      "node-1768367940387",
      "node-1768367950542",
      "node-1768367957289"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "modified-sub-roll-1768364998670": {
    "id": "modified-sub-roll-1768364998670",
    "parentId": "root-1768364888562",
    "type": "MODIFIED",
    "label": "롤",
    "isExpanded": true,
    "childrenIds": [
      "node-1768364998670",
      "node-1768365003225",
      "node-1768365008089"
    ],
    "sourceIds": [
      "sub-roll"
    ],
    "attributes": {
      "nodeType": "category",
      "originalSourceId": "sub-roll",
      "originalLabel": "롤"
    }
  },
  "node-1768364998670": {
    "id": "node-1768364998670",
    "parentId": "modified-sub-roll-1768364998670",
    "type": "CATEGORY",
    "label": "스텐다드",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368658752",
      "node-1768368665774",
      "node-1768368684875"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365003225": {
    "id": "node-1768365003225",
    "parentId": "modified-sub-roll-1768364998670",
    "type": "CATEGORY",
    "label": "울트라",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368693826",
      "node-1768368700091",
      "node-1768368707057"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365008089": {
    "id": "node-1768365008089",
    "parentId": "modified-sub-roll-1768364998670",
    "type": "CATEGORY",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368721958",
      "node-1768368727572"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "modified-sub-combi-1768365014404": {
    "id": "modified-sub-combi-1768365014404",
    "parentId": "root-1768364888562",
    "type": "MODIFIED",
    "label": "콤비",
    "isExpanded": true,
    "childrenIds": [
      "node-1768365014404",
      "node-1768365021298",
      "node-1768365025719"
    ],
    "sourceIds": [
      "sub-combi"
    ],
    "attributes": {
      "nodeType": "category",
      "originalSourceId": "sub-combi",
      "originalLabel": "콤비"
    }
  },
  "node-1768365014404": {
    "id": "node-1768365014404",
    "parentId": "modified-sub-combi-1768365014404",
    "type": "CATEGORY",
    "label": "스텐다드",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369606415",
      "node-1768369616460",
      "node-1768369622426",
      "node-1768369630981",
      "node-1768369656004"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365021298": {
    "id": "node-1768365021298",
    "parentId": "modified-sub-combi-1768365014404",
    "type": "CATEGORY",
    "label": "울트라",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369817595",
      "node-1768369824389",
      "node-1768369849361",
      "node-1768369857574",
      "node-1768378868554",
      "node-1768378878484",
      "node-1768378885707",
      "node-1768378891569"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365025719": {
    "id": "node-1768365025719",
    "parentId": "modified-sub-combi-1768365014404",
    "type": "CATEGORY",
    "label": "전동",
    "isExpanded": true,
    "childrenIds": [
      "node-1768370201628",
      "node-1768370207360",
      "node-1768379143050",
      "node-1768379160094"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "modified-sub-honeycomb-1768365031868": {
    "id": "modified-sub-honeycomb-1768365031868",
    "parentId": "root-1768364888562",
    "type": "MODIFIED",
    "label": "허니콤",
    "isExpanded": true,
    "childrenIds": [
      "node-1768365031868",
      "node-1768365039123",
      "node-1768365047694",
      "node-1768370352259"
    ],
    "sourceIds": [
      "sub-honeycomb"
    ],
    "attributes": {
      "nodeType": "category",
      "originalSourceId": "sub-honeycomb",
      "originalLabel": "허니콤"
    }
  },
  "node-1768365031868": {
    "id": "node-1768365031868",
    "parentId": "modified-sub-honeycomb-1768365031868",
    "type": "CATEGORY",
    "label": "탑다운",
    "isExpanded": true,
    "childrenIds": [
      "node-1768370320001",
      "node-1768379346252"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365039123": {
    "id": "node-1768365039123",
    "parentId": "modified-sub-honeycomb-1768365031868",
    "type": "CATEGORY",
    "label": "바틈업",
    "isExpanded": true,
    "childrenIds": [
      "node-1768370328949",
      "node-1768379372445"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365047694": {
    "id": "node-1768365047694",
    "parentId": "modified-sub-honeycomb-1768365031868",
    "type": "CATEGORY",
    "label": "심프리시티",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365076787": {
    "id": "node-1768365076787",
    "parentId": "node-1768364980930",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768365093733",
      "node-1768365100895"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768365093733": {
    "id": "node-1768365093733",
    "parentId": "node-1768365076787",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768365100895": {
    "id": "node-1768365100895",
    "parentId": "node-1768365076787",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768367940387": {
    "id": "node-1768367940387",
    "parentId": "node-1768364990488",
    "type": "DATA",
    "label": "국산",
    "isExpanded": true,
    "childrenIds": [
      "node-1768367971464",
      "node-1768367981005"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768367950542": {
    "id": "node-1768367950542",
    "parentId": "node-1768364990488",
    "type": "DATA",
    "label": "솜피",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368096127",
      "node-1768368102760",
      "node-1768368107375"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768367957289": {
    "id": "node-1768367957289",
    "parentId": "node-1768364990488",
    "type": "DATA",
    "label": "외산",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368116068",
      "node-1768368121068"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768367971464": {
    "id": "node-1768367971464",
    "parentId": "node-1768367940387",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368003157",
      "node-1768368074644"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768367981005": {
    "id": "node-1768367981005",
    "parentId": "node-1768367940387",
    "type": "DATA",
    "label": "소음",
    "isExpanded": true,
    "childrenIds": [
      "node-1768367988516",
      "node-1768367993291"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768367988516": {
    "id": "node-1768367988516",
    "parentId": "node-1768367981005",
    "type": "DATA",
    "label": "무소음",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768367993291": {
    "id": "node-1768367993291",
    "parentId": "node-1768367981005",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368003157": {
    "id": "node-1768368003157",
    "parentId": "node-1768367971464",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368074644": {
    "id": "node-1768368074644",
    "parentId": "node-1768367971464",
    "type": "DATA",
    "label": "8ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368096127": {
    "id": "node-1768368096127",
    "parentId": "node-1768367950542",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368210792",
      "node-1768368216030",
      "node-1768368220978"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368102760": {
    "id": "node-1768368102760",
    "parentId": "node-1768367950542",
    "type": "DATA",
    "label": "소음",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368232405",
      "node-1768368237718"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368107375": {
    "id": "node-1768368107375",
    "parentId": "node-1768367950542",
    "type": "DATA",
    "label": "앱",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368245760",
      "node-1768368250939"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368116068": {
    "id": "node-1768368116068",
    "parentId": "node-1768367957289",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368560628",
      "node-1768368566508"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368121068": {
    "id": "node-1768368121068",
    "parentId": "node-1768367957289",
    "type": "DATA",
    "label": "앱",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368572825",
      "node-1768368578006"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368210792": {
    "id": "node-1768368210792",
    "parentId": "node-1768368096127",
    "type": "DATA",
    "label": "2ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368216030": {
    "id": "node-1768368216030",
    "parentId": "node-1768368096127",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368220978": {
    "id": "node-1768368220978",
    "parentId": "node-1768368096127",
    "type": "DATA",
    "label": "8ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368232405": {
    "id": "node-1768368232405",
    "parentId": "node-1768368102760",
    "type": "DATA",
    "label": "무소음",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368237718": {
    "id": "node-1768368237718",
    "parentId": "node-1768368102760",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368245760": {
    "id": "node-1768368245760",
    "parentId": "node-1768368107375",
    "type": "DATA",
    "label": "OK",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368250939": {
    "id": "node-1768368250939",
    "parentId": "node-1768368107375",
    "type": "DATA",
    "label": "NO",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368560628": {
    "id": "node-1768368560628",
    "parentId": "node-1768368116068",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368566508": {
    "id": "node-1768368566508",
    "parentId": "node-1768368116068",
    "type": "DATA",
    "label": "8ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368572825": {
    "id": "node-1768368572825",
    "parentId": "node-1768368121068",
    "type": "DATA",
    "label": "OK",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368578006": {
    "id": "node-1768368578006",
    "parentId": "node-1768368121068",
    "type": "DATA",
    "label": "NO",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368609030": {
    "id": "node-1768368609030",
    "parentId": "node-1768364980930",
    "type": "DATA",
    "label": "손잡이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368617130",
      "node-1768368622823",
      "node-1768368630147"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368617130": {
    "id": "node-1768368617130",
    "parentId": "node-1768368609030",
    "type": "DATA",
    "label": "우드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368622823": {
    "id": "node-1768368622823",
    "parentId": "node-1768368609030",
    "type": "DATA",
    "label": "크리스탈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368630147": {
    "id": "node-1768368630147",
    "parentId": "node-1768368609030",
    "type": "DATA",
    "label": "골드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368658752": {
    "id": "node-1768368658752",
    "parentId": "node-1768364998670",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369185124",
      "node-1768369190750"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368665774": {
    "id": "node-1768368665774",
    "parentId": "node-1768364998670",
    "type": "DATA",
    "label": "손잡이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369202890",
      "node-1768369211974"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368684875": {
    "id": "node-1768368684875",
    "parentId": "node-1768364998670",
    "type": "DATA",
    "label": "줄길이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368693826": {
    "id": "node-1768368693826",
    "parentId": "node-1768365003225",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369261454",
      "node-1768369266008"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368700091": {
    "id": "node-1768368700091",
    "parentId": "node-1768365003225",
    "type": "DATA",
    "label": "손잡이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369273731",
      "node-1768369278903"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368707057": {
    "id": "node-1768368707057",
    "parentId": "node-1768365003225",
    "type": "DATA",
    "label": "줄길이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368721958": {
    "id": "node-1768368721958",
    "parentId": "node-1768365008089",
    "type": "DATA",
    "label": "국산",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368737982",
      "node-1768368744302"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368727572": {
    "id": "node-1768368727572",
    "parentId": "node-1768365008089",
    "type": "DATA",
    "label": "솜피",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368808033",
      "node-1768368812491"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368737982": {
    "id": "node-1768368737982",
    "parentId": "node-1768368721958",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368755940",
      "node-1768368760875"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368744302": {
    "id": "node-1768368744302",
    "parentId": "node-1768368721958",
    "type": "DATA",
    "label": "소음",
    "isExpanded": true,
    "childrenIds": [
      "node-1768368770072",
      "node-1768368776497"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368755940": {
    "id": "node-1768368755940",
    "parentId": "node-1768368737982",
    "type": "DATA",
    "label": "2ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368760875": {
    "id": "node-1768368760875",
    "parentId": "node-1768368737982",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768368770072": {
    "id": "node-1768368770072",
    "parentId": "node-1768368744302",
    "type": "DATA",
    "label": "무소음",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368776497": {
    "id": "node-1768368776497",
    "parentId": "node-1768368744302",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368808033": {
    "id": "node-1768368808033",
    "parentId": "node-1768368727572",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369303621",
      "node-1768369309267"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768368812491": {
    "id": "node-1768368812491",
    "parentId": "node-1768368727572",
    "type": "DATA",
    "label": "앱",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369316654",
      "node-1768369322650"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369185124": {
    "id": "node-1768369185124",
    "parentId": "node-1768368658752",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369190750": {
    "id": "node-1768369190750",
    "parentId": "node-1768368658752",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369202890": {
    "id": "node-1768369202890",
    "parentId": "node-1768368665774",
    "type": "DATA",
    "label": "크리스탈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369211974": {
    "id": "node-1768369211974",
    "parentId": "node-1768368665774",
    "type": "DATA",
    "label": "골드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369246834": {
    "id": "node-1768369246834",
    "parentId": "node-1768364980930",
    "type": "DATA",
    "label": "줄길이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369261454": {
    "id": "node-1768369261454",
    "parentId": "node-1768368693826",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369266008": {
    "id": "node-1768369266008",
    "parentId": "node-1768368693826",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369273731": {
    "id": "node-1768369273731",
    "parentId": "node-1768368700091",
    "type": "DATA",
    "label": "크리스탈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369278903": {
    "id": "node-1768369278903",
    "parentId": "node-1768368700091",
    "type": "DATA",
    "label": "골드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369303621": {
    "id": "node-1768369303621",
    "parentId": "node-1768368808033",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369309267": {
    "id": "node-1768369309267",
    "parentId": "node-1768368808033",
    "type": "DATA",
    "label": "8ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369316654": {
    "id": "node-1768369316654",
    "parentId": "node-1768368812491",
    "type": "DATA",
    "label": "OK",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369322650": {
    "id": "node-1768369322650",
    "parentId": "node-1768368812491",
    "type": "DATA",
    "label": "NO",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369606415": {
    "id": "node-1768369606415",
    "parentId": "node-1768365014404",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369718261",
      "node-1768369724009"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369616460": {
    "id": "node-1768369616460",
    "parentId": "node-1768365014404",
    "type": "DATA",
    "label": "손잡이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369758508",
      "node-1768369763547",
      "node-1768369768469"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369622426": {
    "id": "node-1768369622426",
    "parentId": "node-1768365014404",
    "type": "DATA",
    "label": "줄길이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369630981": {
    "id": "node-1768369630981",
    "parentId": "node-1768365014404",
    "type": "DATA",
    "label": "하단바",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369780060",
      "node-1768369798713",
      "node-1768369805192"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369656004": {
    "id": "node-1768369656004",
    "parentId": "node-1768365014404",
    "type": "DATA",
    "label": "해드커버",
    "isExpanded": true,
    "childrenIds": [
      "node-1768369668807",
      "node-1768369676002"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768369668807": {
    "id": "node-1768369668807",
    "parentId": "node-1768369656004",
    "type": "DATA",
    "label": "NO",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369676002": {
    "id": "node-1768369676002",
    "parentId": "node-1768369656004",
    "type": "DATA",
    "label": "OK",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369718261": {
    "id": "node-1768369718261",
    "parentId": "node-1768369606415",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369724009": {
    "id": "node-1768369724009",
    "parentId": "node-1768369606415",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369758508": {
    "id": "node-1768369758508",
    "parentId": "node-1768369616460",
    "type": "DATA",
    "label": "우드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369763547": {
    "id": "node-1768369763547",
    "parentId": "node-1768369616460",
    "type": "DATA",
    "label": "크리스탈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369768469": {
    "id": "node-1768369768469",
    "parentId": "node-1768369616460",
    "type": "DATA",
    "label": "골드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369780060": {
    "id": "node-1768369780060",
    "parentId": "node-1768369630981",
    "type": "DATA",
    "label": "일자바",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369798713": {
    "id": "node-1768369798713",
    "parentId": "node-1768369630981",
    "type": "DATA",
    "label": "U자바",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768369805192": {
    "id": "node-1768369805192",
    "parentId": "node-1768369630981",
    "type": "DATA",
    "label": "항아리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768378868554": {
    "id": "node-1768378868554",
    "parentId": "node-1768365021298",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379010105",
      "node-1768379016271"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768378878484": {
    "id": "node-1768378878484",
    "parentId": "node-1768365021298",
    "type": "DATA",
    "label": "손잡이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379023574",
      "node-1768379030564",
      "node-1768379035760"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768378885707": {
    "id": "node-1768378885707",
    "parentId": "node-1768365021298",
    "type": "DATA",
    "label": "줄길이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768378891569": {
    "id": "node-1768378891569",
    "parentId": "node-1768365021298",
    "type": "DATA",
    "label": "하단바",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379050029",
      "node-1768379061071",
      "node-1768379068280"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768379010105": {
    "id": "node-1768379010105",
    "parentId": "node-1768378868554",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379016271": {
    "id": "node-1768379016271",
    "parentId": "node-1768378868554",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379023574": {
    "id": "node-1768379023574",
    "parentId": "node-1768378878484",
    "type": "DATA",
    "label": "우드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379030564": {
    "id": "node-1768379030564",
    "parentId": "node-1768378878484",
    "type": "DATA",
    "label": "크리스탈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379035760": {
    "id": "node-1768379035760",
    "parentId": "node-1768378878484",
    "type": "DATA",
    "label": "골드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379050029": {
    "id": "node-1768379050029",
    "parentId": "node-1768378891569",
    "type": "DATA",
    "label": "일자바",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379061071": {
    "id": "node-1768379061071",
    "parentId": "node-1768378891569",
    "type": "DATA",
    "label": "U자바",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379068280": {
    "id": "node-1768379068280",
    "parentId": "node-1768378891569",
    "type": "DATA",
    "label": "항아리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379143050": {
    "id": "node-1768379143050",
    "parentId": "node-1768365025719",
    "type": "DATA",
    "label": "국산",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379150745",
      "node-1768379223160"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379150745": {
    "id": "node-1768379150745",
    "parentId": "node-1768379143050",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379272427",
      "node-1768379279628"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768379160094": {
    "id": "node-1768379160094",
    "parentId": "node-1768365025719",
    "type": "DATA",
    "label": "솜피",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379233894",
      "node-1768379239515"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379223160": {
    "id": "node-1768379223160",
    "parentId": "node-1768379143050",
    "type": "DATA",
    "label": "소음",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379290091",
      "node-1768379297429"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768379233894": {
    "id": "node-1768379233894",
    "parentId": "node-1768379160094",
    "type": "DATA",
    "label": "리모콘",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379303883",
      "node-1768379311292"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768379239515": {
    "id": "node-1768379239515",
    "parentId": "node-1768379160094",
    "type": "DATA",
    "label": "앱",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379325807",
      "node-1768379330774"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768379272427": {
    "id": "node-1768379272427",
    "parentId": "node-1768379150745",
    "type": "DATA",
    "label": "2ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379279628": {
    "id": "node-1768379279628",
    "parentId": "node-1768379150745",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379290091": {
    "id": "node-1768379290091",
    "parentId": "node-1768379223160",
    "type": "DATA",
    "label": "무소음",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379297429": {
    "id": "node-1768379297429",
    "parentId": "node-1768379223160",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379303883": {
    "id": "node-1768379303883",
    "parentId": "node-1768379233894",
    "type": "DATA",
    "label": "4ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379311292": {
    "id": "node-1768379311292",
    "parentId": "node-1768379233894",
    "type": "DATA",
    "label": "8ch",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379325807": {
    "id": "node-1768379325807",
    "parentId": "node-1768379239515",
    "type": "DATA",
    "label": "OK",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379330774": {
    "id": "node-1768379330774",
    "parentId": "node-1768379239515",
    "type": "DATA",
    "label": "NO",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379346252": {
    "id": "node-1768379346252",
    "parentId": "node-1768365031868",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379357536",
      "node-1768379363226"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379357536": {
    "id": "node-1768379357536",
    "parentId": "node-1768379346252",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379363226": {
    "id": "node-1768379363226",
    "parentId": "node-1768379346252",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379372445": {
    "id": "node-1768379372445",
    "parentId": "node-1768365039123",
    "type": "DATA",
    "label": "방향",
    "isExpanded": true,
    "childrenIds": [
      "node-1768379380005",
      "node-1768379384896"
    ],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379380005": {
    "id": "node-1768379380005",
    "parentId": "node-1768379372445",
    "type": "DATA",
    "label": "좌",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "node-1768379384896": {
    "id": "node-1768379384896",
    "parentId": "node-1768379372445",
    "type": "DATA",
    "label": "우",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "item"
    }
  },
  "root-f1": {
    "id": "root-f1",
    "parentId": null,
    "type": "ROOT",
    "label": "대구원단 (표준상품)",
    "isExpanded": true,
    "childrenIds": [
      "cat-blind-f1",
      "cat-curtain-f1"
    ],
    "attributes": {
      "nodeType": "root",
      "partnerId": "f1",
      "treeType": "standard"
    },
    "sourceIds": []
  },
  "cat-blind-f1": {
    "id": "cat-blind-f1",
    "parentId": "root-f1",
    "type": "CATEGORY",
    "label": "블라인드",
    "isExpanded": true,
    "childrenIds": [],
    "sourceIds": ["cat-blind"],
    "attributes": {
      "nodeType": "category"
    }
  },
  "cat-curtain-f1": {
    "id": "cat-curtain-f1",
    "parentId": "root-f1",
    "type": "CATEGORY",
    "label": "커튼",
    "isExpanded": true,
    "childrenIds": [],
    "sourceIds": ["cat-curtain"],
    "attributes": {
      "nodeType": "category"
    }
  },
  "root-f1-measure": {
    "id": "root-f1-measure",
    "parentId": null,
    "type": "ROOT",
    "label": "대구원단 (무료실측)",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "root",
      "partnerId": "f1",
      "treeType": "measure"
    },
    "sourceIds": [
      "root-1768350652484"
    ]
  },
  "root-f1-laundry": {
    "id": "root-f1-laundry",
    "parentId": null,
    "type": "ROOT",
    "label": "대구원단 (세탁접수)",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "root",
      "partnerId": "f1",
      "treeType": "laundry"
    },
    "sourceIds": [
      "root-1768350630954"
    ]
  },
  "root-f1-system": {
    "id": "root-f1-system",
    "parentId": null,
    "type": "ROOT",
    "label": "대구원단 (시스템)",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "root",
      "partnerId": "f1",
      "treeType": "system"
    },
    "sourceIds": [
      "root-1768364888562"
    ]
  },
  "node-1769237342551": {
    "id": "node-1769237342551",
    "parentId": "node-1768353977029",
    "type": "DATA",
    "label": "스카이블루",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237348902": {
    "id": "node-1769237348902",
    "parentId": "node-1768353977029",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237354024": {
    "id": "node-1769237354024",
    "parentId": "node-1768353977029",
    "type": "DATA",
    "label": "블랙",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237370732": {
    "id": "node-1769237370732",
    "parentId": "node-1768353986749",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237375085": {
    "id": "node-1769237375085",
    "parentId": "node-1768353986749",
    "type": "DATA",
    "label": "베이지",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237379400": {
    "id": "node-1769237379400",
    "parentId": "node-1768353986749",
    "type": "DATA",
    "label": "화이트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237384409": {
    "id": "node-1769237384409",
    "parentId": "node-1768353994866",
    "type": "DATA",
    "label": "그레이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237388448": {
    "id": "node-1769237388448",
    "parentId": "node-1768353994866",
    "type": "DATA",
    "label": "민트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237402440": {
    "id": "node-1769237402440",
    "parentId": "node-1768353994866",
    "type": "DATA",
    "label": "민트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237444867": {
    "id": "node-1769237444867",
    "parentId": "node-1768353947168",
    "type": "DATA",
    "label": "그레이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237453062": {
    "id": "node-1769237453062",
    "parentId": "prod-std-curtain",
    "type": "DATA",
    "label": "네이비",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237458620": {
    "id": "node-1769237458620",
    "parentId": "prod-std-curtain",
    "type": "DATA",
    "label": "네이비",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237473641": {
    "id": "node-1769237473641",
    "parentId": "node-1768353953653",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237479712": {
    "id": "node-1769237479712",
    "parentId": "node-1768353953653",
    "type": "DATA",
    "label": "피치",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237488498": {
    "id": "node-1769237488498",
    "parentId": "node-1768353947168",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237501150": {
    "id": "node-1769237501150",
    "parentId": "node-1768353908573",
    "type": "DATA",
    "label": "그레이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237513862": {
    "id": "node-1769237513862",
    "parentId": "node-1768354837717",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237519775": {
    "id": "node-1769237519775",
    "parentId": "node-1768354837717",
    "type": "DATA",
    "label": "블랙",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237547129": {
    "id": "node-1769237547129",
    "parentId": "node-1768354846052",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237552098": {
    "id": "node-1769237552098",
    "parentId": "node-1768354846052",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237556839": {
    "id": "node-1769237556839",
    "parentId": "node-1768354855432",
    "type": "DATA",
    "label": "베이지",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237561412": {
    "id": "node-1769237561412",
    "parentId": "node-1768354855432",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237573640": {
    "id": "node-1769237573640",
    "parentId": "node-1768354865411",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237577173": {
    "id": "node-1769237577173",
    "parentId": "node-1768354865411",
    "type": "DATA",
    "label": "민트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237587104": {
    "id": "node-1769237587104",
    "parentId": "node-1768354872436",
    "type": "DATA",
    "label": "네이비",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237592016": {
    "id": "node-1769237592016",
    "parentId": "node-1768354872436",
    "type": "DATA",
    "label": "그레이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237598373": {
    "id": "node-1769237598373",
    "parentId": "node-1768354878592",
    "type": "DATA",
    "label": "베이지",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237602892": {
    "id": "node-1769237602892",
    "parentId": "node-1768354878592",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1769237607721": {
    "id": "node-1769237607721",
    "parentId": "node-1768354878592",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  }
};
