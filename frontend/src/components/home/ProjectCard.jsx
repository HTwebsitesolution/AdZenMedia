import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "@/lib/content";

const Visit = ({ url, name }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2247FF] hover:underline" aria-label={`Visit ${name} (opens in a new tab)`}>
    Visit site <ArrowUpRight size={14} aria-hidden />
  </a>
);

export const ProjectCard = ({ p, large }) => {
  const rel = p.related && PROJECTS.find((x) => x.id === p.related);
  return (
    <article className="group" data-testid={`project-card-${p.id}`}>
      <div className="relative">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_50px_-30px_rgba(21,23,28,.45)]">
          <img src={`/work/${p.id}-d.webp`} alt={`${p.name} website, desktop view`} loading="lazy" width="1200" height="750"
            className="w-full aspect-[16/10] object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
        <img src={`/work/${p.id}-m.webp`} alt={`${p.name} website, mobile view`} loading="lazy" width="360" height="779"
          className={`absolute -bottom-6 right-4 ${large ? "w-[22%]" : "w-[24%]"} rounded-xl border-4 border-[#15171C] shadow-xl aspect-[9/19] object-cover object-top`} />
      </div>
      <div className="mt-9 pr-4">
        <p className="text-sm font-semibold text-[#2247FF]">{p.label}</p>
        <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-[-0.02em]">{p.name}</h3>
        <p className="mt-2 text-[#3a3d45]">{p.text}</p>
        {p.parts ? (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {p.parts.map((x) => (
              <div key={x.title} className="border-t border-black/15 pt-3">
                <p className="font-semibold">{x.title}</p>
                <p className="text-sm text-[#565a63] mt-1">{x.text}</p>
                {x.shot && <img src={`/work/${x.shot}-d.webp`} alt="Oakrange customer portal public login screen" loading="lazy" className="mt-3 rounded-lg border border-black/10 aspect-[16/10] object-cover object-top" />}
                <div className="mt-2"><Visit url={x.url} name={`Oakrange ${x.title}`} /></div>
              </div>
            ))}
          </div>
        ) : <div className="mt-3"><Visit url={p.url} name={p.name} /></div>}
        {rel && <p className="mt-3 text-sm text-[#565a63]">Related publishing work: <a href={`#project-${rel.id}`} className="underline">{rel.name}</a></p>}
      </div>
    </article>
  );
};

export const ReviewNote = () => (
  <p className="rounded-xl border border-dashed border-black/30 px-4 py-3 text-sm text-[#3a3d45]" data-testid="portfolio-review-note">
    Review preview: project screenshots and descriptions are waiting for owner approval and are hidden on adzenmedia.com.
  </p>
);
