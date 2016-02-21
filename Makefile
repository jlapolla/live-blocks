define $(d)template
$(eval include helpdoc.mk)
$(eval include watch.mk)
$(eval $(d)order := $(d)classes/getUndefined.js)
$(eval $(d)order += $(d)classes/extendClass.js)
$(eval $(d)order += $(d)classes/hasOwnProperty.js)
$(eval $(d)order += $(d)classes/multiInheritClass.js)
$(eval $(d)order += $(d)classes/ArrayIterator.js)
$(eval $(d)order += $(d)classes/Queue.js)
$(eval $(d)order += $(d)classes/Set.js)
$(eval $(d)order += $(d)classes/Map.js)
$(eval $(d)order += $(d)classes/EventEmitter.js)
$(eval $(d)order += $(d)classes/Wire.js)
$(eval $(d)order += $(d)classes/WireConstraint.js)
$(eval $(d)order += $(d)classes/BlackBox.js)

$(call helpdoc,$(d)dist/live-blocks.js,LiveBlocks for browser)
$(d)dist/live-blocks.js: $(wildcard $(d)classes/*) $(addprefix $(d)iife/,$(addsuffix .js,header footer))
	mkdir -p $(d)dist/
	cat $(d)iife/header.js $($(d)order) $(d)iife/footer.js > $(d)dist/live-blocks.js

$(call helpdoc,$(d)test/live-blocks-test.js,LiveBlocks which exposes private properties for testing (not for use in production))
$(d)test/live-blocks-test.js: $(wildcard $(d)classes/*) $(addprefix $(d)iife/test-,$(addsuffix .js,header footer))
	mkdir -p $(d)test/
	cat $(d)iife/test-header.js $($(d)order) $(d)iife/test-footer.js > $(d)test/live-blocks-test.js

.PHONY: $(d)all
$(call helpdoc,$(d)all,Build main files)
$(d)all: $(d)dist/live-blocks.js

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
	jscs -x $(wildcard $(d)classes/*) $(wildcard $(d)spec/*)

.PHONY: $(d)clean
$(call helpdoc,$(d)clean,Delete build products)
$(d)clean:
	rm -rf $(d)dist/ $(d)test/ $(d)reports/

$(eval $(d)order :=)

.DEFAULT_GOAL := help

endef

$(eval $($(d)template))
$(eval $(d)template :=)

