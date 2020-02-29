/**
 * Illustrates the async functions and await keyord introduced in ES7.
 * These are essentially a syntactic sugar on top of promises. They
 * make it possible to write asynchronous code that resembles the
 * structure of synchronous code segments.
 */
describe("async/await", function () {
    // Returns a promise that is resolved after 100 ms.
    function resolveFast() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("fast");
            }, 100);
        });
    }

    // Returns a promise that is resolved after 300 ms.
    function resolveSlow() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("slow");
            }, 300);
        });
    }

    it('async function returns a Promise object', function () {
        async function fun() {
            return "ABC";
        }

        // Invoking fun returns and already resolved promise. The
        // promise resolve value must be "ABC".
        fun().then((value) => expect(value).toEqual("ABC"));
    });

    it('illustrates async function expressions', function () {
        // The following async function expression throws an exception
        // which means that the promise it returns is rejected
        let async_fun_expr = async function () {
            throw new Error;
        };

        async_fun_expr()
            .then(() => expect(true).toBeFalse())
            .catch((error) => expect(error).toBeInstanceOf(Error));
    });

    it('illustrates async arrow functions', function () {
        // The followin async arrow function returns an already rejected
        // promise
        let async_arrow_fun = () => Promise.reject("ABCD");

        async_arrow_fun()
            .then(() => expect(true).toBeFalse())
            .catch((error) => expect(error).toEqual("ABCD"));
    });

    it('await does not suspend execution of the outer function', function () {
        let array = ["start"];
        let promise = (async () => {
            // the following statement should suspend the immediate async arrow
            // function, however the outer function should continue executing.
            array.push(await resolveSlow());
        })();

        array.push("end");

        // The result of the resolveSlow mustn't have been added to the array yet.
        // This is because the 'await resolveSlow' in the inner async function
        // has no effect on the test function and execution of the test function
        // continues uninterrupted.
        expect(array).toEqual(["start", "end"]);

        return promise;
    });

    it('illustrates error handling using regular try...catch', function () {
        // Wrapping the code into async arrow function to avoid having to
        // make the test function itself async (because of await operators)
        (async () => {
            try {
                // Await for an already rejected promise. 'await' throws an exception
                // if promise is rejected
                await Promise.reject("ABC");

                // The control flow must not reach this point
                expect(true).toBeFalse();
            }
            catch (error) {
                expect(error).toEqual("ABC");
            }
        })();
    });

    it('illustrates error handling using the Promise.catch method', function () {
        (async () => {
            // Await for an already rejected promise. 'await' throws an exception
            // if promise is rejected
            await Promise.reject("ABC");
        })()
            .then(() => expect(true).toBeFalse())
            .catch((error) => expect(error).toEqual("ABC"));
    });

    it('illustrates await vs return vs return await', function () {
        async function getPromise(isFulfilled) {
            if (isFulfilled) {
                // The return value is wrapped in a fulfilled promise
                return "AAAA";
            }
            else {
                // The return value is wrapped in a rejected promise
                throw new Error();
            }
        }

        // The following function simply calls the getPromise without
        // waiting for it. As the getPromise function throws an error
        // while the outer async arrow function doesn't 'await' for it,
        // the promise returned by getPromise is ignored and the outer
        // async arrow function returns a new fulfilled promise. The
        // catch block is not triggered.
        (async () => {
            try {
                // Note that the exception thrown by getPromise is not
                // handled and will be propagated all the way up as an
                // uncaught error
                getPromise(false);
            }
            catch (e) {
                expect(true).toBeFalse();
            }
        })()
            .then((arg) => expect(arg).toBeUndefined())
            .catch(() => expect(true).toBeFalse());

        // The following function 'awaits' for the getPromise. But note
        // that we do nothing with the value produced by await when
        // promise resolves. Hence the value is simply discarded. The
        // outer async arrow function returns a new fulfilled promise.
        (async () => {
            try {
                await getPromise(true);
            }
            catch (e) {
                expect(true).toBeFalse();
            }
        })()
            .then((arg) => expect(arg).toBeUndefined())
            .catch(() => expect(true).toBeFalse());

        // Similar to the previous example, however the promise returned
        // by getPromise is rejected. As 'await' waits for it, it will
        // throw an exception that is caught by the catch statement. The
        // return value is then wrapped in a new promise and returned.
        (async () => {
            try {
                await getPromise(false);
                expect(true).toBeFalse();
            }
            catch (e) {
               return "ABC";
            }
        })()
            .then((arg) => expect(arg).toEqual("ABC"))
            .catch(() => expect(true).toBeFalse());

        // The following function simply returns the promise returned
        // by the getPromise function. The catch block within the
        // function will never run because the handling of the promise
        // is deferred.
        (async () => {
            try {
                return getPromise(false);
            }
            catch (e) {
                return "ABC";
            }
        })()
            .then(() => expect(true).toBeFalse())
            .catch((error) => expect(error).toBeInstanceOf(Error));

        // The following function 'awaits' for the promise returned by the
        // getPromise but also returns the value it's fulfilled with. That
        // return value is wrapped in another promise and returned.
        (async () => {
            try {
                return await getPromise(true);
            }
            catch (e) {
                return "ABC";
            }
        })()
            .then((value) => expect(value).toEqual("AAAA"))
            .catch((error) => expect(true).toBeFalse());

        // Similar to above, however the promise returned by getPromise is rejected.
        // As we 'await' for it, the await operator throws an exception that is caught
        // by the catch method. The returned value is then wrapped in a new promise
        // and returned. Note that the returned promise is fulfilled even though
        // the promise returned by getPromise is rejected.
        (async () => {
            try {
                return await getPromise(false);
            }
            catch (e) {
                return "ABC";
            }
        })()
            .then((value) => expect(value).toEqual("ABC"))
            .catch((error) => expect(true).toBeFalse());
    });

    it('start asynchronous dependent operations sequentially', async function () {
        // Start the asynchronous operations sequentially, the later
        // operation starts only after the previous has completed.
        //
        // Note the await operator before invoking the immediate arrow
        // function. The await operator will essentially pause the execution
        // of the test until all the promises within the immediate arrow
        // functions are resolved. The await operators within the immediate
        // arrow function return a pending promise that is then picked up
        // by the outer await operator and returned to the Jasmine framework,
        // making sure it waits for all the asynchronous operations.
        await (async () => {
            // Runs the resolveSlow function asynchronously and yields the
            // execution to the caller until the promise gets resolved.
            let retval = await resolveSlow();
            expect(retval).toEqual("slow");

            // This will run only after the promise returned by resolveSlow
            // has completed. It also runs asynchronously and yields the
            // execution to the caller until the promise is resolved.
            retval = await resolveFast();
            expect(retval).toEqual("fast");
        })();
    });

    /**
     * This test illustrates how to start operations concurrently and then wait
     * for each of the in turn. In other words, while the asynchronous operations
     * are run in parallel, the await operations and their results are still run
     * in series.
     */
    it('start asynchronous operations concurrently and wait for each in turn', async function () {
        // Start the asynchronous operations concurrently and then waits
        // for each of the promises to be resolved one after another.
        await (async () => {
            // Runs the resolveSlow function but doesn't yield the execution
            // to the caller. Instead, the execution continues in this
            // function.
            let slowPromise = resolveSlow();

            // Runs the resolveFast function but doesn't yield the execution
            // to the caller. Instead, the execution continues in this function.
            let fastPromise = resolveFast();

            // Wait for the slow promise to resolve. This will yield the execution
            // back to the caller.
            expect(await slowPromise).toEqual("slow");

            // Wait for the fast promise to resolve. This will essentially run
            // immediately after the previous line because fast promise has been
            // resolved already. Note, however, that this await operation still
            // waits for the previous await to complete.
            expect(await fastPromise).toEqual("fast");
        })();
    });

    /**
     * Check the next test to see how to properly start the parallel operations
     * and wait for them using Promise.all.
     */
    it('failed attempt to start and process operations in parallel', async function () {
        await (async () => {
            // Note that resolveSlow and resolveStart won't run in parallel in this
            // test. The 'await resolveSlow' will start the slow operation and will
            // then yield the execution to the caller which is the outer async arrow
            // function. The 'await Promise.all' will then take the promise generated
            // by the 'await resolveSlow' and suspend the execution of the outer
            // async arrow function. Similarly, the 'await (async ()' will take the
            // promise produced by the outer async arrow function and suspend the
            // execution of the test itself. Only after the promise returned by the
            // resolveSlow is resolved, will resolveFast get the chance to run,
            // followed by the same sequence of steps above. Promise.all basically
            // has no effect here, it will be invoked only once both slow and fast
            // promises have been resolved.
            await Promise.all([
                    await resolveSlow(),
                    await resolveFast()
                ])
                .then((results) => expect(results).toEqual(["slow", "fast"]))
                .catch(() => expect(true).toBeFalse());
        })();
    });

    /**
     * This test illustrates how to run multiple operations in parallel, but also
     * process the results of those operations in parallel (of course this is not
     * exactly true because of the single-threaded nature of JavaScript. Parallel
     * processing of results mean that whichever result is first available will be
     * processed first).
     */
    it('start and process operations in parallel with Promise.all', async function () {
        // Starts the asynchronous operations concurrently and uses Promise.all
        // to wait for all them.
        await (async () => {
            // Used to track which of the inner async arrow functions completes first
            let tmp;

            // The inner immediate async arrow functions are critical for achieving parallel
            // submission. The 'await resolveSlow' will suspend the inner async arrow function
            // and returned the promise which is then assigned to the array to be passed to
            // Promise.all. However, this doesn't suspend the execution of the outer async
            // arrow function, which continues executing the second inner immediate arrow
            // function. 'await resolveFast' will similarly suspend the execution of its
            // encompassing async arrow function but will have no effect on the outer async
            // arrow function. The promise returned by 'await resolveFast' is assigned to
            // the second element of the array and Promise.all is then invoked. It returns
            // a promise at which point 'await Promise' suspends the execution of the
            // outer async arrow function, while 'await (async ()' in turn suspends the
            // execution of the test function. Once the promise returned by Promise.all
            // is resolved, the two inner async functions will run to their completion.
            //
            // Note that the order of completion of the inner async arrow functions is
            // not pre-defined. In this case the 'await resolveFast' will unblock first
            // because its promise will be resolved before that of 'resolveSlow'.
            await Promise.all([
                (async () => {
                    // Await for the 'resolveSlow' promise
                    await resolveSlow();

                    // The other inner async arrow function has been processed first as
                    // the promise returned by 'await resolveFast' has resolved earlier.
                    expect(tmp).toEqual("fast");
                })(),
                (async () => {
                    // Await for the 'resolveFast' promise
                    await resolveFast();

                    // This inner async function completes before the other one
                    tmp = "fast";
                })()
            ]);
        })();
    });
});