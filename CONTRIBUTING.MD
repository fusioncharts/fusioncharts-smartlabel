# FusionCharts SmartLabel

## Repository Structure

Directory       | Summary
----------------|---------------------------------------------
`dist`            | A UMD bundle is built and kept here. This can be included without the need for any build system
`example`         | Example usage of the component. Github page gets generated from here.
`lib`             | Contains a transpiled CommonJS version (generated with Babel) of the code for use with node.js
`script`          | CI script
`src`             | Component source modules
`test`            | Component test cases


## Branching and Tagging Policy

This repository uses standard `git-flow` branch management policy/strategy. If you want to learn more on `git-flow`, refer  to [tutorial from Atlassian](https://www.atlassian.com/git/workflows#!workflow-gitflow) and more details at [http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/).


## Commit Guidelines

The following best practices, coupled with a pinch of common-sense will keep the repository clean and usable in future. The idea is that everything that goes into the repository is not for an individual, but someone else who will be directly or indirectly affected by it.

### Check for errors before committing

Checking for errors should be done for each commit whether it is being pushed to remote or not.

First, you don't want to submit any whitespace errors. Git provides an easy way to check for this — before you commit, run `git diff --check`, which identifies possible whitespace errors and lists them for you. If you run that command before committing, you can tell if you're about to commit whitespace issues that may annoy other developers.

Secondly, you should ensure that your commit does not break builds. Run `npm run test` on the repository to execute all sanity and smoke tests. If any test fail, do not change the test to pass your commit. The tests were there with a purpose. Discuss within the thread to ensure that the changes that you do to test specs are valid. If you are adding a new feature, accompanying them with new tests are a good practice.

### Clean commit message

*More detailed explanation include your motivation for the change and contrast its implementation with previous behavior — this is a good guideline to follow.*

Getting in the habit of creating quality commit messages makes using and collaborating with Git a lot easier. As a general rule, your messages should start with a single line that’s no more than about 50 characters and that describes the changeset concisely, followed by a blank line, followed by a more detailed explanation.

It's also a good idea to use the imperative present tense in these messages. In other words, use commands. Instead of "I added tests for" or "Adding tests for," use "Add tests for."

You should see if your commit message answers the following questions:
Answer the following questions:

1. **Why is this change necessary?**
2. **How does it address the issue?**
3. **What side effects does this change have?**

The first question tells reviewers of your pull request what to expect in the commit, allowing them to more easily identify and point out unrelated changes.

The second question describes, at a high level, what was done to affect change. If your change is obvious, you may be able to omit addressing this question.

The third is the most important question to answer, as it can point out problems where you are making too many changes in one commit or branch. One or two bullet points for related changes may be okay, but five or six are likely indicators of a commit that is doing too many things.

A good commit message template

```
Short (50 chars or less) summary of changes with relevant project management issue ID.

More detailed explanatory text, if necessary.  Wrap it to about 72 characters or so.  In some contexts, the first line is treated as the subject of an email and the rest of the text as the body.  The blank line separating the summary from the body is critical (unless you omit the body entirely); tools like rebase can get confused if you run the two together.

Further paragraphs come after blank lines.

 - Bullet points are okay, too

 - Typically a hyphen or asterisk is used for the bullet, preceded by a single space, with blank lines in between, but conventions vary here
```

Run `git log --no-merges` to see what a nicely formatted project-commit history looks like.


## Guidelines for sending a Pull Request

1. Pull Request should not be accepted with a test failure. Ensure that `npm run test` passes on the `head` of your feature branch.
2. Pull Requests with merge conflict are very difficult to review. Ensure that the `head` of your feature branch is either already merged with `develop` or has no conflict when it is merged with `develop`.
3. Pull Request assumes that the code has been reviewed, tested and feature (or part-feature, or task,) works as accepted.
4. The turn around time to close Pull Request is directly proportional to the delta of changes done - more the change in files, more time it would take. As such, if you anticipate a feature branch to have a large delta on feature completion, break it into sub-issues of the issue-tracker, test them, close them, and then send PR for that branch.
5. Turn around time for Pull Request would get affected if commit messages are unclear.


### Ensuring your commits will not fail build

> `npm run test`

The script associated with `npm run test` will run all tests that ensures that your commit does not break anything in the repository. As such run `npm run test` before you push.

---
*Sections of this document uses excerpts from various books and the Internet. [http://git-scm.com/book/](http://git-scm.com/book/) is one of the dominating influencers.*
