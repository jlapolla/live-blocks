define $(d)template
$(eval include helpdoc.mk)
$(eval include watch.mk)
$(eval $(d)order := $(d)src/getUndefined.js)
$(eval $(d)order += $(d)src/extendClass.js)
$(eval $(d)order += $(d)src/hasOwnProperty.js)
$(eval $(d)order += $(d)src/multiInheritClass.js)
$(eval $(d)order += $(d)src/ArrayIterator.js)
$(eval $(d)order += $(d)src/Queue.js)
$(eval $(d)order += $(d)src/Set.js)
$(eval $(d)order += $(d)src/Map.js)
$(eval $(d)order += $(d)src/EventEmitter.js)
$(eval $(d)order += $(d)src/Wire.js)
$(eval $(d)order += $(d)src/WireConstraint.js)
$(eval $(d)order += $(d)src/BlackBox.js)

$(call helpdoc,$(d)dist/live-blocks.js,LiveBlocks for browser)
$(d)dist/live-blocks.js: $(wildcard $(d)src/*) $(addprefix $(d)partials/,$(addsuffix .js,header footer preamble))
	mkdir -p $(d)dist/
	cat $(d)partials/preamble.js $(d)partials/header.js $($(d)order) $(d)partials/footer.js > $(d)dist/live-blocks.js

$(call helpdoc,$(d)dist/live-blocks.min.js,LiveBlocks for browser (minified))
$(d)dist/live-blocks.min.js: $(d)dist/live-blocks.js $(d)partials/preamble.js
	cat $(d)partials/preamble.js > $(d)dist/live-blocks.min.js
	uglifyjs -mc unsafe -- - < $(d)dist/live-blocks.js >> $(d)dist/live-blocks.min.js

$(call helpdoc,$(d)test/live-blocks-test.js,LiveBlocks which exposes private properties for testing (not for use in production))
$(d)test/live-blocks-test.js: $(wildcard $(d)src/*) $(addprefix $(d)partials/test-,$(addsuffix .js,header footer))
	mkdir -p $(d)test/
	cat $(d)partials/test-header.js $($(d)order) $(d)partials/test-footer.js > $(d)test/live-blocks-test.js

.PHONY: $(d)all
$(call helpdoc,$(d)all,Build main files)
$(d)all: $(addprefix $(d)dist/,$(addsuffix .js,live-blocks live-blocks.min))

.PHONY: $(d)test
$(call helpdoc,$(d)test,Start Karma test runner)
$(d)test: $(d)karma $(d)test/live-blocks.js
	$(if $(d),(cd $(d) && ./karma start),./karma start)

$(d)karma: $(d)node_modules/karma/bin/karma
	ln -sf node_modules/karma/bin/karma $(d)karma

$(d)node_modules/karma/bin/karma:
	$(if $(d),(cd $(d) && npm install),npm install)

$(call helpdoc,$(d)test/live-blocks.js,Soft link to LiveBlocks file to test. Point it at the file you want to test. This allows us to test production and minified versions of LiveBlocks directly.)
$(d)test/live-blocks.js: | $(d)test/live-blocks-test.js
	ln -sf live-blocks-test.js $(d)test/live-blocks.js

.PHONY: $(d)test-deps
$(call helpdoc,$(d)test-deps,Build files needed for testing. For continuous integration run 'make watch WATCHLIST=test-deps' in the background while 'make test' is running.)
$(d)test-deps: $(d)karma $(d)test/live-blocks-test.js

.PHONY: $(d)lint
$(call helpdoc,$(d)lint,Fix code style issues)
$(d)lint:
	jscs -x $(wildcard $(d)src/*) $(wildcard $(d)spec/*)

.PHONY: $(d)clean
$(call helpdoc,$(d)clean,Delete build products)
$(d)clean:
	rm -rf $(d)dist/ $(d)test/ $(d)reports/

$(eval $(d)order :=)

.DEFAULT_GOAL := help

endef

$(eval $($(d)template))
$(eval $(d)template :=)

