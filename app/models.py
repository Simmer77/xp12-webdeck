from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class WidgetConfig(BaseModel):
    id: str = Field(..., description="Unique widget identifier within the tab")
    type: Literal["button", "knob", "slider", "display"] = Field(
        ..., description="Widget interactive type"
    )
    row: int = Field(0, ge=0, description="0-based grid row index")
    col: int = Field(0, ge=0, description="0-based grid column index")
    row_span: int = Field(1, ge=1, le=8, description="Number of rows spanned")
    col_span: int = Field(1, ge=1, le=12, description="Number of columns spanned")

    label: str = Field(..., description="Primary label displayed on the control")
    sublabel: Optional[str] = Field(None, description="Secondary subtitle or unit hint")
    color: str = Field(
        "cyan",
        description="Accent/LED color theme: green, amber, cyan, red, white, blue, magenta",
    )

    # Action bindings for Button
    action_type: Literal["cmnd", "dref_toggle", "dref_set"] = Field(
        "cmnd", description="Primary trigger mode for button widgets"
    )
    command: Optional[str] = Field(
        None, description="X-Plane CMND path to trigger on press"
    )
    write_dataref: Optional[str] = Field(
        None, description="X-Plane DREF path to write or toggle"
    )
    on_value: float = Field(1.0, description="Value written when toggled ON or set")
    off_value: float = Field(0.0, description="Value written when toggled OFF")

    # Status / Telemetry Dataref (used by Button LED, Knob readout, Slider, Display)
    status_dataref: Optional[str] = Field(
        None, description="X-Plane RREF path monitored for live value / LED state"
    )
    secondary_dataref: Optional[str] = Field(
        None,
        description="Optional second RREF path (e.g., standby frequency or target value)",
    )
    led_threshold: float = Field(
        0.5, description="Threshold above which the status LED illuminates"
    )
    led_mode: Literal["threshold", "exact", "nonzero", "none"] = Field(
        "threshold", description="How the LED evaluates status_dataref"
    )
    freq_hz: int = Field(
        5, ge=1, le=30, description="RREF polling frequency in Hz (1-30)"
    )

    # Custom button images / textures
    image_off: Optional[str] = Field(
        None, description="URL/filename of button texture when inactive (OFF)"
    )
    image_on: Optional[str] = Field(
        None, description="URL/filename of button texture when active (ON)"
    )

    # Hybrid Rotary Knob / Encoder properties
    cmd_inc_fine: Optional[str] = Field(
        None, description="Command for + fine step / inner ring CW"
    )
    cmd_dec_fine: Optional[str] = Field(
        None, description="Command for - fine step / inner ring CCW"
    )
    cmd_inc_coarse: Optional[str] = Field(
        None, description="Command for ++ coarse step / outer ring CW"
    )
    cmd_dec_coarse: Optional[str] = Field(
        None, description="Command for -- coarse step / outer ring CCW"
    )
    cmd_push: Optional[str] = Field(
        None, description="Command sent on center tap (PUSH / Managed / CRSR)"
    )
    cmd_pull: Optional[str] = Field(
        None, description="Command sent on center long-press or Pull badge (PULL / Selected)"
    )
    push_label: Optional[str] = Field(
        "PUSH", description="Short badge label for center push action"
    )
    pull_label: Optional[str] = Field(
        "PULL", description="Short badge label for pull action"
    )

    # Direct Dataref step mode for Knob / Slider bounds
    step_fine: float = Field(
        1.0, description="Fine increment/decrement step when writing dataref directly"
    )
    step_coarse: float = Field(
        10.0, description="Coarse increment/decrement step when writing dataref directly"
    )
    min_value: float = Field(0.0, description="Minimum value bound")
    max_value: float = Field(360.0, description="Maximum value bound")
    wrap_around: bool = Field(
        False, description="Wrap value between min_value and max_value (e.g. Heading 001-360)"
    )

    # Slider orientation
    orientation: Literal["horizontal", "vertical"] = Field(
        "vertical", description="Slider layout orientation"
    )

    # Digital Readout / Display formatting
    display_prefix: str = Field("", description="Prefix string before readout value")
    display_suffix: str = Field("", description="Suffix/unit string after readout value")
    decimals: int = Field(0, ge=0, le=6, description="Number of decimal places")
    zero_pad: int = Field(
        0, ge=0, le=8, description="Zero-padding width for integer part (e.g., 3 for HDG 045)"
    )
    show_plus_sign: bool = Field(
        False, description="Prefix positive numbers with '+' (e.g., VS +1500)"
    )
    display_multiplier: float = Field(
        1.0,
        description="Multiply raw dataref value before display (e.g., 0.001 or 100 for %)",
    )


class ProfileTab(BaseModel):
    id: str = Field(..., description="Unique tab ID")
    title: str = Field(..., description="Tab title shown in navigation")
    icon: str = Field("grid", description="Icon identifier for tab")
    columns: int = Field(6, ge=2, le=12, description="Number of grid columns")
    rows: int = Field(4, ge=1, le=8, description="Number of grid rows")
    widgets: List[WidgetConfig] = Field(default_factory=list)


class AircraftProfile(BaseModel):
    icao: str = Field(..., description="Aircraft ICAO code (e.g., DEFAULT, B738, A321)")
    name: str = Field(..., description="Human-readable aircraft profile name")
    description: Optional[str] = Field(
        "", description="Description of the aircraft panel layout"
    )
    author: Optional[str] = Field("XP12 WebDeck", description="Profile author")
    tabs: List[ProfileTab] = Field(default_factory=list)
