(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    getTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (_a = this.getSearchTags) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":2,"./Tracker":3}],5:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":4,"./models":47}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],13:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],18:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],19:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],22:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":9,"./Form":10,"./FormRow":11,"./Header":12,"./InputField":13,"./Label":14,"./Link":15,"./MultilineLabel":16,"./NavigationButton":17,"./OAuthButton":18,"./Section":19,"./Select":20,"./Stepper":21,"./Switch":22,"./WebViewButton":23}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],28:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],29:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],30:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],31:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],32:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],33:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],34:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],35:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],36:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],37:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],40:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],41:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],43:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],44:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],45:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],46:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],47:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":6,"./ChapterDetails":7,"./Constants":8,"./DynamicUI":24,"./HomeSection":25,"./Languages":26,"./Manga":27,"./MangaTile":28,"./MangaUpdate":29,"./PagedResults":30,"./RawData":31,"./RequestHeaders":32,"./RequestInterceptor":33,"./RequestManager":34,"./RequestObject":35,"./ResponseObject":36,"./SearchField":37,"./SearchRequest":38,"./SourceInfo":39,"./SourceManga":40,"./SourceStateManager":41,"./SourceTag":42,"./TagSection":43,"./TrackedManga":44,"./TrackedMangaChapterReadAction":45,"./TrackerActionQueue":46}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NHentai = exports.NHentaiInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NHentaiHelper_1 = require("./NHentaiHelper");
const NHentaiParser_1 = require("./NHentaiParser");
const NHentaiSettings_1 = require("./NHentaiSettings");
const NHENTAI_URL = 'https://nhentai.net';
const API = NHENTAI_URL + '/api';
exports.NHentaiInfo = {
    version: '3.2.4',
    name: 'nhentai',
    icon: 'icon.png',
    author: 'NotMarek',
    authorWebsite: 'https://github.com/notmarek',
    description: 'Extension which pulls 18+ content from nHentai.',
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    websiteBaseURL: NHENTAI_URL,
    sourceTags: [
        {
            text: '18+',
            type: paperback_extensions_common_1.TagType.YELLOW
        },
        {
            text: 'Cloudflare',
            type: paperback_extensions_common_1.TagType.RED
        }
    ]
};
const language = async (stateManager) => {
    const lang = await stateManager.retrieve('languages') ?? '';
    if (lang == '') {
        return '""';
    }
    else {
        return `language:${lang}`;
    }
};
const sortOrder = async (query, stateManager) => {
    const inQuery = NHentaiHelper_1.NHSortOrders.containsShortcut(query);
    if (inQuery[0]?.length !== 0) {
        return [inQuery[0] ?? '', query.replace(inQuery[1] ?? '', '')];
    }
    else {
        const sortOrder = await stateManager.retrieve('sort_order') ?? NHentaiHelper_1.NHSortOrders.getDefault();
        return [sortOrder, query];
    }
};
const extraArgs = async (stateManager) => {
    const args = await NHentaiSettings_1.getExtraArgs(stateManager);
    return ` ${args}`;
};
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15';
class NHentai extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 15000,
            interceptor: {
                interceptRequest: async (request) => {
                    request.headers = {
                        ...(request.headers ?? {}),
                        ...{
                            'user-agent': userAgent,
                            'referer': `${NHENTAI_URL}/`
                        }
                    };
                    return request;
                },
                interceptResponse: async (response) => {
                    return response;
                }
            }
        });
        this.stateManager = createSourceStateManager({});
    }
    async getSourceMenu() {
        return Promise.resolve(createSection({
            id: 'main',
            header: 'Source Settings',
            rows: () => Promise.resolve([
                NHentaiSettings_1.settings(this.stateManager),
                NHentaiSettings_1.resetSettings(this.stateManager),
            ])
        }));
    }
    getMangaShareUrl(mangaId) {
        return `${NHENTAI_URL}/g/${mangaId}`;
    }
    async getMangaDetails(mangaId) {
        const request = createRequestObject({
            url: `${API}/gallery/${mangaId}`,
            method: 'GET'
        });
        const data = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(data.status);
        const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
        return NHentaiParser_1.parseGallery(json_data);
    }
    async getChapters(mangaId) {
        const request = createRequestObject({
            url: `${API}/gallery/${mangaId}`,
            method: 'GET'
        });
        const data = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(data.status);
        const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
        return [NHentaiParser_1.parseGalleryIntoChapter(json_data, mangaId)];
    }
    async getChapterDetails(mangaId) {
        const request = createRequestObject({
            url: `${API}/gallery/${mangaId}`,
            method: 'GET'
        });
        const data = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(data.status);
        const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
        return NHentaiParser_1.parseChapterDetails(json_data, mangaId);
    }
    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const title = query.title ?? '';
        if (metadata?.stopSearch ?? false) {
            return createPagedResults({
                results: [],
                metadata: {
                    stopSearch: true
                }
            });
        }
        if (/^\d+$/.test(title)) {
            const request = createRequestObject({
                url: `${API}/gallery/${title}`,
                method: 'GET'
            });
            const data = await this.requestManager.schedule(request, 1);
            this.CloudFlareError(data.status);
            const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
            return createPagedResults({
                results: NHentaiParser_1.parseSearch({ result: [json_data], num_pages: 1, per_page: 1 }),
                metadata: {
                    page: page + 1,
                    stopSearch: true
                }
            });
        }
        else {
            const q = title + ' ' + await language(this.stateManager) + await extraArgs(this.stateManager);
            const [sort, query] = await sortOrder(q, this.stateManager) ?? ['', q];
            const request = createRequestObject({
                url: `${API}/galleries/search?query=${encodeURIComponent(query ?? '')}&sort=${sort}&page=${page}`,
                method: 'GET'
            });
            const data = await this.requestManager.schedule(request, 1);
            this.CloudFlareError(data.status);
            const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
            return createPagedResults({
                results: NHentaiParser_1.parseSearch(json_data),
                metadata: {
                    page: page + 1
                }
            });
        }
    }
    async getHomePageSections(sectionCallback) {
        const section1 = createHomeSection({ id: 'date', title: 'Recent', view_more: true });
        const section2 = createHomeSection({ id: 'popular-today', title: 'Popular Today', view_more: true });
        const section3 = createHomeSection({ id: 'popular-week', title: 'Popular Week', view_more: true });
        const section4 = createHomeSection({ id: 'popular', title: 'Popular All-time', view_more: true });
        const sections = [section1, section2, section3, section4];
        for (const section of sections) {
            sectionCallback(section);
            const request = createRequestObject({
                url: `${API}/galleries/search?query=${encodeURIComponent(await language(this.stateManager) + await extraArgs(this.stateManager))}&sort=${section.id}`,
                method: 'GET'
            });
            const data = await this.requestManager.schedule(request, 1);
            this.CloudFlareError(data.status);
            const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
            section.items = NHentaiParser_1.parseSearch(json_data);
            sectionCallback(section);
        }
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        let page = metadata?.page ?? 1;
        const request = createRequestObject({
            url: `${API}/galleries/search?query=${encodeURIComponent(await language(this.stateManager) + await extraArgs(this.stateManager))}&sort=${homepageSectionId}&page=${page}`,
            method: 'GET'
        });
        const data = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(data.status);
        const json_data = (typeof data.data == 'string') ? JSON.parse(data.data) : data.data;
        page++;
        return createPagedResults({
            results: NHentaiParser_1.parseSearch(json_data),
            metadata: {
                page: page
            }
        });
    }
    getCloudflareBypassRequest() {
        return createRequestObject({
            url: NHENTAI_URL,
            method: 'GET',
            headers: {
                'user-agent': userAgent,
                'referer': `${NHENTAI_URL}.`
            }
        });
    }
    CloudFlareError(status) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <The name of this source> and press Cloudflare Bypass');
        }
    }
}
exports.NHentai = NHentai;

},{"./NHentaiHelper":49,"./NHentaiParser":50,"./NHentaiSettings":51,"paperback-extensions-common":5}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NHSortOrders = exports.NHLanguages = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class NHLanguagesClass {
    constructor() {
        this.Languages = [
            // Include all langauages
            {
                name: 'Include All',
                NHCode: '',
                PBCode: paperback_extensions_common_1.LanguageCode.UNKNOWN,
                default: true
            },
            {
                // English
                name: 'English',
                NHCode: 'english',
                PBCode: paperback_extensions_common_1.LanguageCode.ENGLISH
            },
            {
                // Japanese
                name: '日本語',
                NHCode: 'japanese',
                PBCode: paperback_extensions_common_1.LanguageCode.JAPANESE
            },
            {
                // Chinese (Simplified)
                name: '中文 (简化字)',
                NHCode: 'chinese',
                PBCode: paperback_extensions_common_1.LanguageCode.CHINEESE
            },
        ];
        // Sorts the languages based on name
        this.Languages = this.Languages.sort((a, b) => a.name > b.name ? 1 : -1);
    }
    getNHCodeList() {
        return this.Languages.map(Language => Language.NHCode);
    }
    getName(NHCode) {
        return this.Languages.filter(Language => Language.NHCode == NHCode)[0]?.name ?? 'Unknown';
    }
    getPBCode(NHCode) {
        return this.Languages.filter(Language => Language.NHCode == NHCode)[0]?.PBCode ?? paperback_extensions_common_1.LanguageCode.UNKNOWN;
    }
    getDefault() {
        return this.Languages.filter(Language => Language.default).map(Language => Language.NHCode);
    }
}
exports.NHLanguages = new NHLanguagesClass();
class NHSortOrderClass {
    constructor() {
        this.SortOrders = [
            {
                // Sort by popular
                name: 'Popular all-time',
                NHCode: 'popular',
                shortcuts: ['s:p', 's:popular', 'sort:p', 'sort:popular'],
                default: true
            },
            {
                // Sort by popular this week
                name: 'Popular this week',
                NHCode: 'popular-week',
                shortcuts: ['s:pw', 's:w', 's:popular-week', 'sort:pw', 'sort:w', 'sort:popular-week'],
            },
            {
                // Sort by popular today
                name: 'Popular today',
                NHCode: 'popular-today',
                shortcuts: ['s:pt', 's:t', 's:popular-today', 'sort:pt', 'sort:t', 'sort:popular-today'],
            },
            {
                // Sort by recent
                name: 'Recent',
                NHCode: 'date',
                shortcuts: ['s:r', 's:recent', 'sort:r', 'sort:recent'],
            },
        ];
        // Sorts the sort orders based on name
        this.SortOrders = this.SortOrders.sort((a, b) => a.name > b.name ? 1 : -1);
    }
    containsShortcut(query) {
        for (const SortOrder of this.SortOrders) {
            for (const shortcut of SortOrder.shortcuts) {
                if (query.includes(shortcut)) {
                    return [SortOrder.NHCode, shortcut];
                }
            }
        }
        return ['', ''];
    }
    getNHCodeList() {
        return this.SortOrders.map(SortOrder => SortOrder.NHCode);
    }
    getName(NHCode) {
        return this.SortOrders.filter(SortOrder => SortOrder.NHCode == NHCode)[0]?.name ?? 'Unknown';
    }
    getDefault() {
        return this.SortOrders.filter(SortOrder => SortOrder.default).map(SortOrder => SortOrder.NHCode);
    }
}
exports.NHSortOrders = new NHSortOrderClass();

},{"paperback-extensions-common":5}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGalleryIntoChapter = exports.parseSearch = exports.parseChapterDetails = exports.parseGallery = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NHentaiHelper_1 = require("./NHentaiHelper");
const typeMap = { 'j': 'jpg', 'p': 'png', 'g': 'gif' };
const typeOfImage = (image) => {
    return typeMap[image.t] ?? '';
};
const getArtist = (gallery) => {
    const tags = gallery.tags;
    for (const tag of tags) {
        if (tag.type === 'artist') {
            return tag.name;
        }
    }
    return '';
};
const getLanguage = (gallery) => {
    const tags = gallery.tags;
    for (const tag of tags) {
        if (tag.type === 'language' && tag.name !== 'translated') {
            return tag.name;
        }
    }
    return '';
};
const parseGallery = (data) => {
    const tags = [];
    for (const tag of data.tags) {
        if (tag.type === 'tag')
            tags.push(createTag({ id: tag.id.toString(), label: tag.name }));
    }
    const artist = getArtist(data);
    return createManga({
        id: data.id.toString(),
        titles: [data.title.english, data.title.japanese, data.title.pretty],
        artist,
        author: artist,
        image: `https://t.nhentai.net/galleries/${data.media_id}/cover.${typeOfImage(data.images.cover)}`,
        rating: 0,
        status: paperback_extensions_common_1.MangaStatus.COMPLETED,
        follows: data.num_favorites,
        tags: [createTagSection({ id: 'tags', label: 'Tags', tags: tags })],
        hentai: true,
    });
};
exports.parseGallery = parseGallery;
const parseChapterDetails = (data, mangaId) => {
    return createChapterDetails({
        id: mangaId,
        mangaId: mangaId,
        longStrip: false,
        pages: data.images.pages.map((image, i) => {
            const type = typeOfImage(image);
            return `https://i.nhentai.net/galleries/${data.media_id}/${i + 1}.${type}`;
        }),
    });
};
exports.parseChapterDetails = parseChapterDetails;
const parseSearch = (data) => {
    const tiles = [];
    for (const gallery of data.result) {
        tiles.push(createMangaTile({
            id: gallery.id.toString(),
            image: `https://t.nhentai.net/galleries/${gallery.media_id}/cover.${typeOfImage(gallery.images.cover)}`,
            subtitleText: createIconText({
                text: NHentaiHelper_1.NHLanguages.getName(getLanguage(gallery))
            }),
            title: createIconText({
                text: gallery.title.pretty
            })
        }));
    }
    return tiles;
};
exports.parseSearch = parseSearch;
const parseGalleryIntoChapter = (data, mangaId) => {
    return createChapter({
        id: mangaId,
        mangaId: mangaId,
        chapNum: 1,
        name: data.title.english,
        langCode: NHentaiHelper_1.NHLanguages.getPBCode(getLanguage(data)),
        time: new Date(data.upload_date * 1000),
    });
};
exports.parseGalleryIntoChapter = parseGalleryIntoChapter;

},{"./NHentaiHelper":49,"paperback-extensions-common":5}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSettings = exports.settings = exports.getSortOrders = exports.getExtraArgs = exports.getLanguages = void 0;
const NHentaiHelper_1 = require("./NHentaiHelper");
const getLanguages = async (stateManager) => {
    return await stateManager.retrieve('languages') ?? NHentaiHelper_1.NHLanguages.getDefault();
};
exports.getLanguages = getLanguages;
const getExtraArgs = async (stateManager) => {
    return await stateManager.retrieve('extra_args') ?? '';
};
exports.getExtraArgs = getExtraArgs;
const getSortOrders = async (stateManager) => {
    return await stateManager.retrieve('sort_order') ?? NHentaiHelper_1.NHSortOrders.getDefault();
};
exports.getSortOrders = getSortOrders;
const settings = (stateManager) => {
    return createNavigationButton({
        id: 'settings',
        value: '',
        label: 'Content Settings',
        form: createForm({
            onSubmit: async (values) => {
                await Promise.all([
                    stateManager.store('languages', values.languages),
                    stateManager.store('sort_order', values.sort_order),
                    stateManager.store('extra_args', values.extra_args.replace(/[“”‘’]/g, '"')),
                ]);
            },
            validate: async () => true,
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'content',
                        footer: 'Modify the nhentai experience to your liking.',
                        rows: () => {
                            return Promise.all([
                                exports.getLanguages(stateManager),
                                exports.getSortOrders(stateManager),
                                exports.getExtraArgs(stateManager),
                            ]).then(async (values) => [
                                createSelect({
                                    id: 'languages',
                                    label: 'Languages',
                                    options: NHentaiHelper_1.NHLanguages.getNHCodeList(),
                                    displayLabel: option => NHentaiHelper_1.NHLanguages.getName(option),
                                    value: values[0],
                                    allowsMultiselect: false,
                                    minimumOptionCount: 1,
                                }),
                                createSelect({
                                    id: 'sort_order',
                                    label: 'Default search sort',
                                    options: NHentaiHelper_1.NHSortOrders.getNHCodeList(),
                                    displayLabel: option => NHentaiHelper_1.NHSortOrders.getName(option),
                                    value: values[1],
                                    allowsMultiselect: false,
                                    minimumOptionCount: 1,
                                }),
                                createInputField({
                                    id: 'extra_args',
                                    label: 'Additional arguments',
                                    placeholder: 'woman -lolicon -shotacon -yaoi',
                                    maskInput: false,
                                    value: values[2],
                                })
                            ]);
                        }
                    })
                ]);
            }
        })
    });
};
exports.settings = settings;
const resetSettings = (stateManager) => {
    return createButton({
        id: 'reset',
        label: 'Reset to Default',
        value: '',
        onTap: async () => {
            await Promise.all([
                stateManager.store('languages', null),
                stateManager.store('sort_order', null),
                stateManager.store('extra_args', null),
            ]);
        }
    });
};
exports.resetSettings = resetSettings;

},{"./NHentaiHelper":49}]},{},[48])(48)
});
