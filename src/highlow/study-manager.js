/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.LITW = window.LITW || {}
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");
require("./js/results");

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./pages/introduction.html";
import irbHTML from "../templates/irb2-litw.html";
import questHTML from "./pages/questionnaire.html";
import demographicsHTML from "../templates/demographics.html";
import resultsHTML from "./pages/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";

//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbTemplate = Handlebars.compile(irbHTML);
let questTemplate = Handlebars.compile(questHTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);


module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let config = {
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0'
		},
		study_id: "2ced834d-363c-4049-8afb-9ef62c0306bd",
		quest_responses: {},
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: introTemplate,
				display_element_id: "intro",
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: irbTemplate,
				display_element_id: "irb",
				template_data: {
					time: study_times.SHORT,
				},
				display_next_button: false,
			},
			QUESTIONNAIRE_1: {
				name: "quest1",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: questTemplate,
				display_element_id: "quest1",
				display_next_button: false,
			},
			QUESTIONNAIRE_2: {
				name: "quest2",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: questTemplate,
				display_element_id: "quest2",
				display_next_button: false,
			},
			QUESTIONNAIRE_3: {
				name: "quest3",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: questTemplate,
				display_element_id: "quest3",
				display_next_button: false,
			},
			QUESTIONNAIRE_4: {
				name: "quest4",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: questTemplate,
				display_element_id: "quest4",
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: demographicsTemplate,
				display_element_id: "demographics",
				display_next_button: false,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: commentsTemplate,
				display_element_id: "comments",
				display_next_button: true,
				finish: function(){
					var comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				name: "results",
				type: LITW.engine.SLIDE_TYPE.CALL_FUNCTION,
				display_next_button: false,
				call_fn: function(){
					calculateResults();
				}
			}
		}
	};

	function configureTimeline() {
		timeline.push(config.slides.INTRODUCTION);
		timeline.push(config.slides.INFORMED_CONSENT);
		config.slides.QUESTIONNAIRE_1.template_data = () => {
			return getQuest1Data(25);
		}
		timeline.push(config.slides.QUESTIONNAIRE_1);
		config.slides.QUESTIONNAIRE_2.template_data = () => {
			return getQuest2Data('quest2', './img/prompt_s.png', 50);
		}
		timeline.push(config.slides.QUESTIONNAIRE_2);
		config.slides.QUESTIONNAIRE_3.template_data = () => {
			return getQuest2Data('quest3', './img/prompt_c.png', 75, false);
		}
		timeline.push(config.slides.QUESTIONNAIRE_3);
		config.slides.QUESTIONNAIRE_4.template_data = () => {
			return getQuest2Data('quest4', './img/prompt_cc.png', 100, false);
		}
		timeline.push(config.slides.QUESTIONNAIRE_4);
		timeline.push(config.slides.DEMOGRAPHICS);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
		return timeline;
	}

	function getQuest1Data(completion) {
		return {
			title: $.i18n("litw-study-quest1-title"),
			progress: {
				value: completion
			},
			quest_id: "quest1",
			done_button: $.i18n("litw-study-quest1-save"),
			questions: [1, 2].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest1-q${x}`)
				}
			}),
			responses: [1, 2, 3, 4, 5].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest1-a${x}`)
				}
			})
		}
	}

	function getQuest2Data(quest_id, img_url, completion, title=true) {
		let data =  {
			img_prompt: {
				url: img_url,
				text_before: $.i18n(`litw-study-${quest_id}-prompt`),
				text_after: $.i18n(`litw-study-${quest_id}-subprompt`),
			},
			progress: {
				value: completion
			},
			quest_id: quest_id,
			done_button: $.i18n(`litw-study-${quest_id}-save`),
			questions: [1, 2, 3].map((q)=> {
				return {
					id: q,
					text: $.i18n(`litw-study-quest2-q${q}`),
					responses: [1, 2, 3, 4, 5].map((r)=> {
						return {
							id: r,
							text: $.i18n(`litw-study-quest2-q${q}-a${r}`)
						}
					})
				}
			}),
		}
		if (title) {
			data.title = $.i18n(`litw-study-${quest_id}-title`);
		}
		return data;
	}

	function calculateResults() {
		//TEST DATA FOR RESULTS PAGE
		if (Object.keys(config.quest_responses).length === 0) {
			config.quest_responses = {
				quest1: { '1': 2, '2': 4 },
				quest2: { '1': 4, '2': 2, '3': 5 },
				quest3: { '1': 3, '2': 1, '3': 5 },
				quest4: { '1': 5, '2': 5, '3': 4 }
			}
		}
		let score = 0;
		for (let quest of Object.values(config.quest_responses)) {
			score += Object.values(quest).reduce((acc, score) => acc+score);
		}
		let results_data = {
			score: score
		}
		showResults(results_data, true)
	}

	function showResults(results = {}, showFooter = false) {
		let results_div = $("#results");
		let recom_studies = [];
		LITW.engage.getStudiesRecommendation(config.study_id, (studies) => {recom_studies = studies});
		if('PID' in LITW.data.getURLparams) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		results_div.html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: recom_studies
				}
			));
		}
		results_div.i18n();
		LITW.utils.showSlide("results");
	}

	function bootstrap() {
		let good_config = LITW.engine.configure_study(config.preLoad, config.languages,
			configureTimeline(), config.study_id);
		if (good_config){
			LITW.engine.start_study();
		} else {
			console.error("Study configuration error!");
			//TODO fail nicely, maybe a page with useful info to send to the tech team?
		}
	}


	// when the page is loaded, start the study!
	$(document).ready(function() {
		bootstrap();
	});
	exports.study = {};
	exports.study.params = config

})( window.LITW = window.LITW || {} );


