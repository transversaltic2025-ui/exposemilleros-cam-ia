export type {
  CategoriaPresentacion,
  EstadoAnalisisIA,
  EstadoAsignacion,
  EstadoEvaluacionHumana,
  EstadoProyecto,
  LineaTematica,
  ModalidadParticipacion,
  OpcionSiNo,
  Semillero,
} from "@/lib/constants";
import type { AIAnalysis } from "./ai-analysis";
import type { Assignment } from "./assignment";
import type { TrendByArea } from "./analytics";
import type { Evaluator } from "./evaluator";
import type { HumanEvaluation } from "./evaluation";
import type { Project } from "./project";

export type {
  ProjectParticipantRegistration,
  ProjectRegistrationInput,
} from "./project-registration";
export type { Project, ProjectParticipant } from "./project";
export type { ProjectMember, ProjectMemberRole, ProjectTeamPayload } from "./project";
export type { Evaluator } from "./evaluator";
export type { Assignment } from "./assignment";
export type { EvaluationCriterion, EvaluationDetailInput, HumanEvaluation } from "./evaluation";
export type { AIAnalysis } from "./ai-analysis";
export type { EventLogistics, LogisticsSummary } from "./logistics";
export type { CertificateRecord } from "./certificate";
export type { HumanVsAIComparison, TrendByArea } from "./analytics";

export type ProyectoPublico = Project;
export type EvaluadorAdmin = Evaluator;
export type AsignacionAdmin = Assignment;
export type EvaluacionHumana = HumanEvaluation;
export type AnalisisIA = AIAnalysis;
export type TendenciaArea = TrendByArea;
