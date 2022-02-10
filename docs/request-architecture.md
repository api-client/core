# HTTP request architecture

## Step 1: Prepare environment

In this phase the request factory queries for the current environment and evaluates environment variables.
It halts the execution when error occur.

## Step 2: Evaluate request

Takes variables prepared in the step 1 and applies them to the HTTP request object. This includes configuration and actions. It halts the execution when error occur.

## Step 3: Run request actions

Defined on the request object actions are executed. Depending on the action configuration it may halt the execution of the request.

## Step 4: Run HTTP request modules

If the request modules are registered then they are executed in order of registration.

## Step 5: Execute the HTTP request

The request is executed by the HTTP engine.

## Step 6: Run response actions

Defined on the request object response actions are executed. Depending on the action configuration it may halt the reporting of the response.

## Step 7: Run HTTP response modules

If the response modules are registered then they are executed in order of registration.

## Step 8: Report the execution log

Here the request and response log is reported back to the application.
