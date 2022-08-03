import { OnApplicationBootstrap } from '@nestjs/common';
import { AdministratorEvent, Channel, ChannelService, CurrencyCode, EventBus, FacetService, FacetValue, FacetValueService, isGraphQlErrorResult, LanguageCode, PluginCommonModule, Role, RoleEvent, RoleService, Translated, translateDeep, VendurePlugin } from '@vendure/core';
//import { filter } from 'rxjs/operators';


/*
[run:server] seen an administrator event! AdministratorEvent {
[run:server]   createdAt: 2022-04-29T10:29:12.972Z,
[run:server]   entity: Administrator {
[run:server]     createdAt: 2022-04-29T09:29:12.686Z,
[run:server]     updatedAt: 2022-04-29T09:29:12.686Z,
[run:server]     deletedAt: null,
[run:server]     firstName: 'Molly',
[run:server]     lastName: 'Lodge',
[run:server]     emailAddress: 'tlodge+mollylodge@gmail.com',
[run:server]     id: 6,
[run:server]     user: User {
[run:server]       createdAt: 2022-04-29T09:29:12.686Z,
[run:server]       updatedAt: 2022-04-29T09:29:12.686Z,
[run:server]       deletedAt: null,
[run:server]       identifier: 'tlodge+mollylodge@gmail.com',
[run:server]       verified: true,
[run:server]       lastLogin: null,
[run:server]       id: 16,
[run:server]       roles: [Array]
[run:server]     }
[run:server]   },
[run:server]   type: 'created',
[run:server]   ctx: RequestContext {
[run:server]     _req: IncomingMessage {
[run:server]       _readableState: [ReadableState],
[run:server]       _events: [Object: null prototype],
[run:server]       _eventsCount: 1,
[run:server]       _maxListeners: undefined,
[run:server]       socket: [Socket],
[run:server]       httpVersionMajor: 1,
[run:server]       httpVersionMinor: 1,
[run:server]       httpVersion: '1.1',
[run:server]       complete: true,
[run:server]       rawHeaders: [Array],
[run:server]       rawTrailers: [],
[run:server]       aborted: false,
[run:server]       upgrade: false,
[run:server]       url: '/?languageCode=en',
[run:server]       method: 'POST',
[run:server]       statusCode: null,
[run:server]       statusMessage: null,
[run:server]       client: [Socket],
[run:server]       _consuming: true,
[run:server]       _dumped: false,
[run:server]       next: [Function: next],
[run:server]       baseUrl: '/admin-api',
[run:server]       originalUrl: '/admin-api?languageCode=en',
[run:server]       _parsedUrl: [Url],
[run:server]       params: {},
[run:server]       query: [Object],
[run:server]       res: [ServerResponse],
[run:server]       sessionOptions: {},
[run:server]       session: [Getter/Setter],
[run:server]       body: [Object],
[run:server]       _body: true,
[run:server]       length: undefined,
[run:server]       i18nextLookupName: 'querystring',
[run:server]       lng: 'en',
[run:server]       locale: 'en',
[run:server]       language: 'en',
[run:server]       languages: [Array],
[run:server]       i18n: [I18n],
[run:server]       t: [Function: bound t],
[run:server]       vendureRequestContext: [RequestContext],
[run:server]       vendureRequestContextMap: [Map],
[run:server]       [Symbol(kCapture)]: false,
[run:server]       [Symbol(kHeaders)]: [Object],
[run:server]       [Symbol(kHeadersCount)]: 38,
[run:server]       [Symbol(kTrailers)]: null,
[run:server]       [Symbol(kTrailersCount)]: 0,
[run:server]       [Symbol(RequestTimeout)]: undefined
[run:server]     },
[run:server]     _apiType: 'admin',
[run:server]     _channel: Channel {
[run:server]       token: 'f6iay5jigjk8l7t865pf',
[run:server]       createdAt: 2022-04-29T07:35:29.084Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.346Z,
[run:server]       code: '__default_channel__',
[run:server]       defaultLanguageCode: 'en',
[run:server]       currencyCode: 'USD',
[run:server]       pricesIncludeTax: false,
[run:server]       id: 1,
[run:server]       defaultShippingZone: [Zone],
[run:server]       defaultTaxZone: [Zone]
[run:server]     },
[run:server]     _session: {
[run:server]       cacheExpiry: 1651228413,
[run:server]       id: 13,
[run:server]       token: 'bf665ef99914688297dd6c185c674944e7e3ca56dac28edfe9c4f81b40f2bed3',
[run:server]       expires: 2023-04-29T15:47:56.617Z,
[run:server]       activeOrderId: null,
[run:server]       activeChannelId: 1,
[run:server]       authenticationStrategy: 'native',
[run:server]       user: [Object]
[run:server]     },
[run:server]     _languageCode: 'en',
[run:server]     _isAuthorized: true,
[run:server]     _authorizedAsOwnerOnly: false,
[run:server]     _translationFn: [Function: bound t]
[run:server]   },
[run:server]   input: {
[run:server]     firstName: 'Molly',
[run:server]     lastName: 'Lodge',
[run:server]     emailAddress: 'tlodge+mollylodge@gmail.com',
[run:server]     password: 'go8tie',
[run:server]     roleIds: [ 7 ],
[run:server]     customFields: {}
[run:server]   }
[run:server] }
[run:server] facets are
[run:server] Facet {
[run:server]   createdAt: 2022-04-29T07:35:31.407Z,
[run:server]   updatedAt: 2022-04-29T07:35:31.407Z,
[run:server]   isPrivate: false,
[run:server]   code: 'category',
[run:server]   id: 1,
[run:server]   values: [
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.418Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.418Z,
[run:server]       code: 'electronics',
[run:server]       id: 1,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Electronics'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.427Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.427Z,
[run:server]       code: 'computers',
[run:server]       id: 2,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Computers'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.112Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.112Z,
[run:server]       code: 'photo',
[run:server]       id: 9,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Photo'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.386Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.386Z,
[run:server]       code: 'sports-outdoor',
[run:server]       id: 17,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Sports & Outdoor'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.395Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.395Z,
[run:server]       code: 'equipment',
[run:server]       id: 18,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Equipment'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.643Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.643Z,
[run:server]       code: 'footwear',
[run:server]       id: 23,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Footwear'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.200Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.200Z,
[run:server]       code: 'home-garden',
[run:server]       id: 30,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Home & Garden'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.209Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.209Z,
[run:server]       code: 'plants',
[run:server]       id: 31,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Plants'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.438Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.438Z,
[run:server]       code: 'furniture',
[run:server]       id: 34,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Furniture'
[run:server]     }
[run:server]   ],
[run:server]   channels: [
[run:server]     Channel {
[run:server]       token: 'f6iay5jigjk8l7t865pf',
[run:server]       createdAt: 2022-04-29T07:35:29.084Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.346Z,
[run:server]       code: '__default_channel__',
[run:server]       defaultLanguageCode: 'en',
[run:server]       currencyCode: 'USD',
[run:server]       pricesIncludeTax: false,
[run:server]       id: 1
[run:server]     }
[run:server]   ],
[run:server]   translations: [
[run:server]     FacetTranslation {
[run:server]       createdAt: 2022-04-29T07:35:31.403Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.407Z,
[run:server]       languageCode: 'en',
[run:server]       name: 'category',
[run:server]       id: 1
[run:server]     }
[run:server]   ],
[run:server]   languageCode: 'en',
[run:server]   name: 'category'
[run:server] }
[run:server] Facet {
[run:server]   createdAt: 2022-04-29T07:35:31.438Z,
[run:server]   updatedAt: 2022-04-29T07:35:31.438Z,
[run:server]   isPrivate: false,
[run:server]   code: 'brand',
[run:server]   id: 2,
[run:server]   values: [
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.447Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.447Z,
[run:server]       code: 'apple',
[run:server]       id: 3,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Apple'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.617Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.617Z,
[run:server]       code: 'logitech',
[run:server]       id: 4,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Logitech'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.655Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.655Z,
[run:server]       code: 'samsung',
[run:server]       id: 5,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Samsung'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.743Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.743Z,
[run:server]       code: 'corsair',
[run:server]       id: 6,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Corsair'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.816Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.816Z,
[run:server]       code: 'admi',
[run:server]       id: 7,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'ADMI'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:31.912Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.912Z,
[run:server]       code: 'seagate',
[run:server]       id: 8,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Seagate'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.119Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.119Z,
[run:server]       code: 'polaroid',
[run:server]       id: 10,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Polaroid'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.149Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.149Z,
[run:server]       code: 'nikkon',
[run:server]       id: 11,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Nikkon'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.182Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.182Z,
[run:server]       code: 'agfa',
[run:server]       id: 12,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Agfa'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.213Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.213Z,
[run:server]       code: 'manfrotto',
[run:server]       id: 13,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Manfrotto'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.244Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.244Z,
[run:server]       code: 'kodak',
[run:server]       id: 14,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Kodak'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.275Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.275Z,
[run:server]       code: 'sony',
[run:server]       id: 15,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Sony'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.351Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.351Z,
[run:server]       code: 'rolleiflex',
[run:server]       id: 16,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Rolleiflex'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.403Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.403Z,
[run:server]       code: 'pinarello',
[run:server]       id: 19,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Pinarello'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.439Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.439Z,
[run:server]       code: 'everlast',
[run:server]       id: 20,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Everlast'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.559Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.559Z,
[run:server]       code: 'nike',
[run:server]       id: 21,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Nike'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.591Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.591Z,
[run:server]       code: 'wilson',
[run:server]       id: 22,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Wilson'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.651Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.651Z,
[run:server]       code: 'adidas',
[run:server]       id: 24,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Adidas'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.104Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.104Z,
[run:server]       code: 'converse',
[run:server]       id: 29,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Converse'
[run:server]     }
[run:server]   ],
[run:server]   channels: [
[run:server]     Channel {
[run:server]       token: 'f6iay5jigjk8l7t865pf',
[run:server]       createdAt: 2022-04-29T07:35:29.084Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.346Z,
[run:server]       code: '__default_channel__',
[run:server]       defaultLanguageCode: 'en',
[run:server]       currencyCode: 'USD',
[run:server]       pricesIncludeTax: false,
[run:server]       id: 1
[run:server]     }
[run:server]   ],
[run:server]   translations: [
[run:server]     FacetTranslation {
[run:server]       createdAt: 2022-04-29T07:35:31.434Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.438Z,
[run:server]       languageCode: 'en',
[run:server]       name: 'brand',
[run:server]       id: 2
[run:server]     }
[run:server]   ],
[run:server]   languageCode: 'en',
[run:server]   name: 'brand'
[run:server] }
[run:server] Facet {
[run:server]   createdAt: 2022-04-29T07:35:32.662Z,
[run:server]   updatedAt: 2022-04-29T07:35:32.662Z,
[run:server]   isPrivate: false,
[run:server]   code: 'color',
[run:server]   id: 3,
[run:server]   values: [
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.670Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.670Z,
[run:server]       code: 'blue',
[run:server]       id: 25,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'blue'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.676Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.676Z,
[run:server]       code: 'pink',
[run:server]       id: 26,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'pink'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.764Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.764Z,
[run:server]       code: 'black',
[run:server]       id: 27,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'black'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:32.862Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.862Z,
[run:server]       code: 'white',
[run:server]       id: 28,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'white'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.447Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.447Z,
[run:server]       code: 'gray',
[run:server]       id: 35,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'gray'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.550Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.550Z,
[run:server]       code: 'brown',
[run:server]       id: 36,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'brown'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.611Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.611Z,
[run:server]       code: 'wood',
[run:server]       id: 37,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'wood'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.763Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.763Z,
[run:server]       code: 'yellow',
[run:server]       id: 38,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'yellow'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.781Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.781Z,
[run:server]       code: 'green',
[run:server]       id: 39,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'green'
[run:server]     }
[run:server]   ],
[run:server]   channels: [
[run:server]     Channel {
[run:server]       token: 'f6iay5jigjk8l7t865pf',
[run:server]       createdAt: 2022-04-29T07:35:29.084Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.346Z,
[run:server]       code: '__default_channel__',
[run:server]       defaultLanguageCode: 'en',
[run:server]       currencyCode: 'USD',
[run:server]       pricesIncludeTax: false,
[run:server]       id: 1
[run:server]     }
[run:server]   ],
[run:server]   translations: [
[run:server]     FacetTranslation {
[run:server]       createdAt: 2022-04-29T07:35:32.659Z,
[run:server]       updatedAt: 2022-04-29T07:35:32.662Z,
[run:server]       languageCode: 'en',
[run:server]       name: 'color',
[run:server]       id: 3
[run:server]     }
[run:server]   ],
[run:server]   languageCode: 'en',
[run:server]   name: 'color'
[run:server] }
[run:server] Facet {
[run:server]   createdAt: 2022-04-29T07:35:33.218Z,
[run:server]   updatedAt: 2022-04-29T07:35:33.218Z,
[run:server]   isPrivate: false,
[run:server]   code: 'plant-type',
[run:server]   id: 4,
[run:server]   values: [
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.226Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.226Z,
[run:server]       code: 'indoor',
[run:server]       id: 32,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Indoor'
[run:server]     },
[run:server]     FacetValue {
[run:server]       createdAt: 2022-04-29T07:35:33.259Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.259Z,
[run:server]       code: 'outdoor',
[run:server]       id: 33,
[run:server]       facet: [Facet],
[run:server]       translations: [Array],
[run:server]       languageCode: 'en',
[run:server]       name: 'Outdoor'
[run:server]     }
[run:server]   ],
[run:server]   channels: [
[run:server]     Channel {
[run:server]       token: 'f6iay5jigjk8l7t865pf',
[run:server]       createdAt: 2022-04-29T07:35:29.084Z,
[run:server]       updatedAt: 2022-04-29T07:35:31.346Z,
[run:server]       code: '__default_channel__',
[run:server]       defaultLanguageCode: 'en',
[run:server]       currencyCode: 'USD',
[run:server]       pricesIncludeTax: false,
[run:server]       id: 1
[run:server]     }
[run:server]   ],
[run:server]   translations: [
[run:server]     FacetTranslation {
[run:server]       createdAt: 2022-04-29T07:35:33.215Z,
[run:server]       updatedAt: 2022-04-29T07:35:33.218Z,
[run:server]       languageCode: 'en',
[run:server]       name: 'plant type',
[run:server]       id: 4
[run:server]     }
[run:server]   ],
[run:server]   languageCode: 'en',
[run:server]   name: 'plant type'
[run:server] }*/

const gentoken = (length:Number)=>{
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

@VendurePlugin({
    imports: [PluginCommonModule]
})
export class NewVendorPlugin implements OnApplicationBootstrap {

  constructor(private eventBus: EventBus, private facetService: FacetService, private facetValueService: FacetValueService, private channelService: ChannelService, private roleService: RoleService ) {}

  async onApplicationBootstrap() {

    this.eventBus.ofType(AdministratorEvent)
      //.pipe(
      //  filter(event => event.toState === 'PaymentSettled'),
      //)
      .subscribe(async (event) => {
            const {type, ctx, entity} = event;
            const {user, firstName, lastName, id} = entity;

            if (type === 'created'){
                //create a new channel for this user
               const code = `${lastName}_${firstName}_${id}`;
               
               const input = {
                code,
                token: gentoken(18),
                defaultLanguageCode: LanguageCode.en,
                pricesIncludeTax: true,
                currencyCode: CurrencyCode.GBP,
                defaultTaxZoneId: 2,
                defaultShippingZoneId: 2,
               }

               const channel = await this.channelService.create(ctx, input) 
               if (isGraphQlErrorResult(channel)) {
                 return;
               }

             
               //now add facets to this new channel, so that this new user can use them!  
               const facets = await this.facetService.findAll(ctx);
    
                for (const facet of facets.items){
                    //add an assertion to stop typescript complaining.  From author:
                    //the reason TS complains is that the facetService.findAll() method returns Translated<Facet> which recursively affects nested entities like Channel too. 
                    //In this case it is totally safe to use an assertion as Channel to make TS happy
                    
                    facet.channels =  [...facet.channels, channel] as Channel [] & Translated<Channel>[];
                    await this.facetService.update(ctx, facet);
                }    

                const facetvalues = await this.facetValueService.findAll(LanguageCode.en);

                for (const fv of facetvalues){
                    this.channelService.assignToChannels(ctx, FacetValue, fv.id, [channel.id]);
                }

                const roles = await this.roleService.findAll(ctx);
                const role = roles.items.reduce((acc:Role,item:Role)=>{
                    if (item.code==="vendor")
                        return item;
                    return acc;
                },{} as Role);

                const nr = {
                    code:channel.code, 
                    permissions: role.permissions,
                    description: role.description,
                }

                console.log("creating a new role", nr);
                const _nr = await this.roleService.create(ctx,nr);
                //now create a new role from copying vendor role and assign it to the new channel!
                //now assign role to channel!
                await this.roleService.assignRoleToChannel(ctx, _nr.id, channel.id);
                //take off the default channel!
                await this.channelService.removeFromChannels(ctx, Role, _nr.id, [1]);
            }
        // do some action when this event fires
      });
    }
}