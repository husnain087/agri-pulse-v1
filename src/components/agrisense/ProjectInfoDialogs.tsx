import { Database, ExternalLink, FileText, Info, Target, Eye, Compass, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DATASETS = [
  { name: "Corn or Maize Leaf Disease Dataset", d: "Supports maize leaf disease classification research.", url: "https://www.kaggle.com/datasets/smaranjitghose/corn-or-maize-leaf-disease-dataset" },
  { name: "PlantVillage Dataset", d: "Plant leaf image dataset useful for crop disease classification and model development.", url: "https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset" },
  { name: "Wheat Leaf Dataset", d: "Wheat leaf images relevant to healthy-leaf, Septoria, and Stripe Rust classification.", url: "https://www.kaggle.com/datasets/olyadgetch/wheat-leaf-dataset" },
];

const OBJECTIVES = [
  "Identify supported crop categories from images.",
  "Detect selected wheat and maize leaf diseases.",
  "Provide machine-learning predictions through an accessible web interface.",
  "Support model interpretation through heatmaps where available.",
  "Explore irrigation-event prediction and crop water management.",
  "Develop an agricultural chatbot grounded in trusted reference materials.",
  "Progressively expand into fertilizer recommendations, weather risk, crop stress, yield prediction, and pest monitoring.",
];

const contentCls = "max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl";

export function ProjectInfoDialogs() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild><Button variant="outline"><Database /> Explore Project Datasets</Button></DialogTrigger>
        <DialogContent className={contentCls}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Datasets Used in AgriPulse AI</DialogTitle>
            <DialogDescription>Selected public dataset references related to this project.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-3">
            {DATASETS.map((ds) => (
              <li key={ds.url} className="surface rounded-xl p-4">
                <h3 className="font-semibold">{ds.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{ds.d}</p>
                <Button asChild size="sm" className="mt-3">
                  <a href={ds.url} target="_blank" rel="noopener noreferrer">Open Dataset on Kaggle <ExternalLink /><span className="sr-only">(opens in a new tab)</span></a>
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><strong className="text-foreground">Dataset Disclosure Notice:</strong> The datasets listed here represent a selection of the publicly accessible resources associated with this project. Additional datasets, curated samples, preprocessing resources, and supporting data sources may also be used during development and experimentation. For confidentiality, licensing, and project documentation considerations, only selected dataset references are disclosed publicly. The list above is not necessarily an exhaustive inventory of all data used in the project.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild><Button variant="outline"><FileText /> Problem Statement</Button></DialogTrigger>
        <DialogContent className={contentCls}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" /> Why AgriPulse AI Was Built</DialogTitle>
            <DialogDescription>The problem, objectives, vision and mission behind the platform.</DialogDescription>
          </DialogHeader>
          <section className="space-y-3 text-sm text-muted-foreground">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><FileText className="h-4 w-4 text-primary" /> Problem Statement</h3>
            <p>Agriculture is essential for food security and livelihoods, yet farmers face challenges in identifying crop diseases, monitoring crop health, managing irrigation, and accessing reliable agricultural guidance. Visual symptoms of different plant diseases can be similar, and timely access to agricultural experts may be limited. Agricultural knowledge is also distributed across multiple sources, making it difficult to find relevant information quickly.</p>
            <p>Many existing digital tools address only individual agricultural problems rather than providing an integrated solution for crop identification, disease recognition, predictive analysis, and knowledge-based support.</p>
            <p>AgriPulse AI aims to address these challenges through an AI-powered smart agriculture platform that combines crop identification, selected wheat and maize leaf disease classification, and a foundation for predictive analytics and agricultural knowledge assistance. The platform is designed to help users obtain preliminary insights from crop images and progressively access more informed agricultural decision support.</p>
            <p>The long-term goal is to extend the platform with irrigation scheduling, crop water requirement estimation, fertilizer recommendations, weather-related agricultural risk analysis, crop stress monitoring, yield prediction, pest detection, and a retrieval-augmented agricultural chatbot.</p>
            <p>AgriPulse AI is intended to support farmers and agricultural stakeholders in making better-informed decisions. Its predictions are advisory and should not replace expert agronomic advice, laboratory diagnosis, or local agricultural recommendations.</p>
          </section>
          <section className="text-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold"><Target className="h-4 w-4 text-primary" /> Project Objectives</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{OBJECTIVES.map((o) => <li key={o}>{o}</li>)}</ul>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface rounded-xl p-4 text-sm"><h3 className="flex items-center gap-2 font-semibold"><Eye className="h-4 w-4 text-primary" /> Project Vision</h3><p className="mt-1 text-muted-foreground">“To make practical AI-powered agricultural decision support more accessible, helping farmers and agricultural stakeholders make better-informed crop management decisions.”</p></div>
            <div className="surface rounded-xl p-4 text-sm"><h3 className="flex items-center gap-2 font-semibold"><Compass className="h-4 w-4 text-primary" /> Project Mission</h3><p className="mt-1 text-muted-foreground">“To integrate computer vision, machine learning, predictive analytics, and trustworthy agricultural knowledge into a unified and accessible smart agriculture platform.”</p></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
