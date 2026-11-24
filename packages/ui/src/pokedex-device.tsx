import type { ReactNode } from "react";

export interface PokedexDeviceProps {
  /** Left label in the screen header, e.g. "Drug Safety Scanner". */
  screenTitle: string;
  /** Right label in the screen header, e.g. "Live Scan 001". */
  screenTag?: string;
  /** Footer labels (left, right). */
  footer?: [string, string];
  /** Content rendered on the green LCD screen. */
  children: ReactNode;
  className?: string;
}

/** The ClinDex Pokédex device: red shell, lens, indicators, LCD screen and controls. */
export function PokedexDevice({
  screenTitle,
  screenTag,
  footer,
  children,
  className = "",
}: PokedexDeviceProps) {
  return (
    <div className={`pokedex-shell ${className}`.trim()}>
      <div className="pokedex-hinge" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="pokedex-top" aria-hidden="true">
        <div className="lens">
          <i />
        </div>
        <div className="flex gap-2 pt-2">
          <b className="indicator red" />
          <b className="indicator yellow" />
          <b className="indicator green" />
        </div>
      </div>
      <div className="pokedex-body">
        <div className="screen-bezel">
          <div className="screen-header">
            <span>{screenTitle}</span>
            {screenTag ? <span>{screenTag}</span> : null}
          </div>
          <div className="screen-content">{children}</div>
        </div>
        <div className="pokedex-controls" aria-hidden="true">
          <div className="d-pad">
            <i />
          </div>
          <div className="control-center">
            <i />
            <div>
              <b>A</b>
              <b>B</b>
            </div>
            <p>
              SELECT <span>START</span>
            </p>
          </div>
          <div className="speaker">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      {footer ? (
        <div className="pokedex-foot">
          <span>{footer[0]}</span>
          <span>{footer[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
