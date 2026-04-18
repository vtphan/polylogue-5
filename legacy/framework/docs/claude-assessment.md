>prompt: I ran 2 episodes of strangers-in-the-old-forest through the pipeline, as the first manual test of    
  the revised build_assistive_package. This revision was described in                                  
  framework/docs/runtime-package-refactor.md and its implementation                                    
  ./framework/docs/runtime-package-refactor-implementation-plan.md . Review the assitive packages for  
  the first two episodes (./artifacts/strangers-in-the-old-forest/) to see if there's any issue that   
  needs to be addressed  

  

 I reviewed both packages against the runtime-package-refactor spec. The structural refactor landed   
  cleanly — runtime-first sections are in place, the four front-door blocks are populated with strong, 
  episode-specific, 6th-grade-readable text, the information barrier holds, and                        
  target_passage_id/turn_ids/character_ids are exposed in analytic_core for wrong_focus detection.     
                                                                                                       
  But the deterministic-retrieval contract is only partially enforced. Five issues, in roughly         
  descending priority:                                                                                 
                                                                                                       
  1. Diagnostic trigger enum violation (blocker for no-LLM retrieval)                                  
  Every diagnostic probe in both packages has trigger: inactivity_or_manual. The spec (implementation
  plan §B5) requires {after_check_fail, after_repeat_fail, missing_selection, low_confidence}. Root    
  cause: framework/pipeline/agents/diagnostic_agent.md:47 still uses the legacy value in its example.  
  The schema (framework/schemas/assistive_package.yaml:231-243) types                                  
  probes/interventions/struggle_calibration as opaque objects with no enum, so neither the validator   
  nor the reviewer caught it.                                                                          

  2. Teacher calibration_warnings shape mismatch (blocker for teacher dashboard)                       
  Currently a list of plain prose strings (e.g. assistive_package.yaml:2481-2489). Spec requires
  objects with trigger enum from {many_students_cannot_start, many_students_wrong_focus,               
  high_retry_rate, low_discussion_participation}. The schema itself is wrong:
  assistive_package.yaml:267-271 declares items: type: string. Without trigger, the teacher dashboard  
  cannot route deterministically.                                 

  3. support_id not zero-padded
  Packages emit p1_at_1, p1_sf_5, etc.; spec requires p1_at_01. Schema declares support_id as a free
  string with no pattern. Cosmetic but breaks the contract the spec is explicit about.                 
   
  4. Schema bug: attention_targets.use_when too narrow                                                 
  assistive_package.yaml:116 restricts to [cannot_start, wrong_focus]. The other three front-door
  blocks correctly allow all four values. Spec lists all four for every front-door block. Inconsistency
   that will silently constrain authors.
                                                                                                       
  5. Schema doesn't enforce most of the new contract                                                   
  diagnostic_support, discussion_support, and teacher_support are validated only as "object exists,
  list exists." discussion_support.talk_moves/consensus_checks are typed as list of string — yet the   
  actual output uses richer objects with phase fields. The output is good (cues correctly use
  group_start/mid_discussion/group_wrap_up), but validate_schema.py and package_reviewer aren't        
  enforcing the spec's enums end-to-end. That's why issues 1–4 went unflagged.

  What's clean (no action needed): top-level sections match spec; all four front-door sub-blocks       
  present; coverage invariant met (every passage has ≥1 attention_target and ≥1 sentence_frame_seed);
  use_when for the other three front-door blocks uses correct enum values; student-facing text is      
  6th-grade and episode-specific (e.g. p1_me_1 EP01: "Now go back to turn 2 and try it in your own
  words"); no leakage of facet/lens/pattern IDs into student-facing fields; handoffs consistently
  return students to the episode; review_support correctly absent; package_meta complete; integrity
  14/14 in both episodes; structure identical across the two episodes.

  Recommended fix order: patch the schema for #2/#3/#4 first (cheap), update diagnostic_agent.md to use
   a real trigger value for #1, then add field-scoped reviewer checks so the next pilot run catches
  drift automatically.  