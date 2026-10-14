// AI provider selection. Keys stay server-side Worker secrets; never sent to the browser.
//   liara : LIARA_API_KEY + AI_BASE_URL (project URL from the Liara panel). Chat Completions only;
//           live web search by the ":online" model suffix (e.g. openai/gpt-4.1-mini:online).
//   avalai: AVALAI_API_KEY. /responses with the web_search tool.
//   netarz: NETARZ_API_KEY (legacy).
export type ProviderEnv={AI_PROVIDER?:string;AI_BASE_URL?:string;LIARA_API_KEY?:string;AVALAI_API_KEY?:string;NETARZ_API_KEY?:string;AI_MODEL_SEARCH?:string};
export type ProviderName='liara'|'avalai'|'netarz';
const DEFAULTS:Record<ProviderName,{base:string;search:string;chatOnly:boolean;searchStyle:'online'|'responses'}>={
  liara:{base:'',search:'openai/gpt-4.1-mini:online',chatOnly:true,searchStyle:'online'},
  avalai:{base:'https://api.avalai.ir/v1',search:'gpt-5.6-luna',chatOnly:false,searchStyle:'responses'},
  netarz:{base:'https://netarz.ir/api/ai/v1',search:'gpt-4.1-mini',chatOnly:false,searchStyle:'responses'},
};
const KEY:Record<ProviderName,keyof ProviderEnv>={liara:'LIARA_API_KEY',avalai:'AVALAI_API_KEY',netarz:'NETARZ_API_KEY'};
export function provider(env:ProviderEnv){
  const requested=String(env.AI_PROVIDER||'').toLowerCase();
  const name:ProviderName=requested in DEFAULTS?requested as ProviderName:env.LIARA_API_KEY?'liara':env.AVALAI_API_KEY?'avalai':'netarz';
  const d=DEFAULTS[name];
  const base=(env.AI_BASE_URL||d.base).trim().replace(/\/(chat\/completions|responses)\/?$/,'').replace(/\/$/,'');
  // A provider without its own base URL (Liara) is not configured until AI_BASE_URL is set.
  const key=base?String(env[KEY[name]]||''):'';
  return {name,key,base,searchModel:env.AI_MODEL_SEARCH||d.search,chatOnly:d.chatOnly,searchStyle:d.searchStyle};
}
export function onlineModel(model:string){return /:online$/.test(model)?model:model+':online';}
