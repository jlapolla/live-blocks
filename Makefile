# Source files must be concatenated in a specific order
$(eval $(d)order := $(d)src/getUndefined.js)
$(eval $(d)order += $(d)src/extendClass.js)
$(eval $(d)order += $(d)src/hasOwnProperty.js)
$(eval $(d)order += $(d)src/multiInheritClass.js)
$(eval $(d)order += $(d)src/isArray.js)
$(eval $(d)order += $(d)src/ArrayIterator.js)
$(eval $(d)order += $(d)src/Queue.js)
$(eval $(d)order += $(d)src/Set.js)
$(eval $(d)order += $(d)src/Map.js)
$(eval $(d)order += $(d)src/EventEmitter.js)
$(eval $(d)order += $(d)src/Wire.js)
$(eval $(d)order += $(d)src/ImmediateBlock.js)
$(eval $(d)order += $(d)src/ClockedBlock.js)
$(eval $(d)order += $(d)src/TimedBlock.js)
$(eval $(d)order += $(d)src/Clock.js)
$(eval $(d)order += $(d)src/ManualTimer.js)
$(eval $(d)order += $(d)src/AsyncTimer.js)
$(eval $(d)order += $(d)src/IntervalTimer.js)
$(eval $(d)order += $(d)src/BlackBox.js)

# Source files wrapped in "test" IIFE
define $(d)template
$(d)test/$(patsubst $(d)src/%,%,$(1)): $(1) $(addprefix $(d)partials/test-,$(addsuffix .js,header footer))
	mkdir -p $(d)test/
	cat $(d)partials/test-header.js $(1) $(d)partials/test-footer.js > $(d)test/$(patsubst $(d)src/%,%,$(1))
endef
$(foreach $(d)var,$($(d)order),$(eval $(call $(d)template,$($(d)var))))

define $(d)template
$(eval include helpdoc.mk)
$(eval include watch.mk)

$(call helpdoc,$(d)dist/live-blocks.js,LiveBlocks for browser)
$(d)dist/live-blocks.js: $($(d)order) $(addprefix $(d)partials/,$(addsuffix .js,header footer preamble))
	mkdir -p $(d)dist/
	cat $(d)partials/preamble.js $(d)partials/header.js $($(d)order) $(d)partials/footer.js > $(d)dist/live-blocks.js

$(call helpdoc,$(d)dist/live-blocks.min.js,LiveBlocks for browser (minified))
$(d)dist/live-blocks.min.js: $(d)dist/live-blocks.js $(d)partials/preamble.js
	cat $(d)partials/preamble.js > $(d)dist/live-blocks.min.js
	uglifyjs -mc unsafe -- - < $(d)dist/live-blocks.js >> $(d)dist/live-blocks.min.js

.PHONY: $(d)all
$(call helpdoc,$(d)all,Build main files)
$(d)all: $(addprefix $(d)dist/,$(addsuffix .js,live-blocks live-blocks.min))

.PHONY: $(d)test
$(call helpdoc,$(d)test,Start Karma test runner to run tests on source files)
$(d)test: $(d)karma $(d)test/test-start.js $(patsubst $(d)src/%,$(d)test/%,$($(d)order))
	$(if $(d),(cd $(d) && ./karma start config/karma.conf.js),./karma start config/karma.conf.js)

.PHONY: $(d)test-production
$(call helpdoc,$(d)test-production,Start Karma test runner to run tests on built live-blocks.js file)
$(d)test-production: $(d)karma $(d)dist/live-blocks.js
	$(if $(d),(cd $(d) && ./karma start config/karma-production.conf.js),./karma start config/karma-production.conf.js)

.PHONY: $(d)test-minified
$(call helpdoc,$(d)test-minified,Start Karma test runner to run tests on minified live-blocks.min.js file)
$(d)test-minified: $(d)karma $(d)dist/live-blocks.min.js
	$(if $(d),(cd $(d) && ./karma start config/karma-minified.conf.js),./karma start config/karma-minified.conf.js)

$(d)karma: $(d)node_modules/karma/bin/karma
	ln -sf node_modules/karma/bin/karma $(d)karma

$(d)node_modules/karma/bin/karma:
	$(if $(d),(cd $(d) && npm install),npm install)

.PHONY: $(d)test-deps
$(call helpdoc,$(d)test-deps,Build files needed for testing. For continuous integration run 'make watch WATCHLIST=test-deps' in the background while 'make test' is running.)
$(d)test-deps: $(d)karma $(d)test/test-start.js $(patsubst $(d)src/%,$(d)test/%,$($(d)order))

$(d)test/test-start.js: $(d)partials/test-start.js
	mkdir -p $(d)test/
	cp $(d)partials/test-start.js $(d)test/test-start.js

.PHONY: $(d)serve-reports
$(call helpdoc,$(d)serve-reports,Run 'make serve-reports' to view code coverage reports in your browser. Starts an HTTP server serving files from $(d)reports/ on port 8080.)
$(d)serve-reports:
	http-server -c-1 $(d)reports/

.PHONY: $(d)lint
$(call helpdoc,$(d)lint,Fix code style issues)
$(d)lint:
	jscs -x -r inline $(wildcard $(d)src/*) $(wildcard $(d)spec/*)

.PHONY: $(d)clean
$(call helpdoc,$(d)clean,Delete build products)
$(d)clean:
	rm -rf $(d)dist/ $(d)test/ $(d)reports/

.DEFAULT_GOAL := help

endef

$(eval $($(d)template))
$(eval $(d)template :=)
$(eval $(d)order :=)
$(eval $(d)var :=)

